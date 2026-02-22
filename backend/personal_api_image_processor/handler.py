import json
import logging
import os
import boto3
from io import BytesIO
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

_s3 = None

# Raw bucket (source) and destination buckets
RAW_BUCKET = os.environ.get('RAW_BUCKET', 'shendy-raw')

# Map path prefix to destination bucket
DESTINATION_BUCKETS = {
    'watches': os.environ.get('WATCHES_BUCKET', 'shendy-watches'),
    'albums': os.environ.get('ALBUMS_BUCKET', 'shendy-albums'),
    'fishtank': os.environ.get('FISHTANK_BUCKET', 'shendy-fishtank'),
}

# WebP quality settings
THUMBNAIL_MAX_SIZE = 400  # Max dimension for thumbnails
FULL_MAX_SIZE = 2000  # Max dimension for full images
WEBP_QUALITY = 90

# Thumbnail aspect ratios by type (width:height)
THUMBNAIL_ASPECT_RATIOS = {
    'watches': (3, 4),    # Portrait
    'albums': (1, 1),     # Square
    'fishtank': (16, 9),  # Landscape
}


def lambda_handler(event, context):
    """
    AWS Lambda entry point.
    Triggered by S3 when a file is uploaded to shendy-raw bucket.
    
    Processes the image:
    1. Downloads from shendy-raw
    2. Converts to WebP
    3. Extracts EXIF metadata
    4. Uploads processed image to final bucket (based on path prefix)
    5. Deletes raw file
    """
    global _s3
    if _s3 is None:
        _s3 = boto3.client('s3')
    
    # Process each record (S3 event can have multiple)
    for record in event.get('Records', []):
        try:
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']
            
            logger.info(f'Processing: {bucket}/{key}')
            process_image(bucket, key)
            
        except Exception as e:
            logger.error(f'Error processing record: {str(e)}')
            # Don't raise - continue processing other records
    
    return {'statusCode': 200, 'body': 'OK'}


def process_image(raw_bucket, raw_key):
    """Process a single image from raw bucket to final location."""
    # Parse the key: {type}/{path}/filename.ext
    # e.g., watches/Seiko/SKX007/thumbnail.jpg
    # e.g., watches/Seiko/SKX007/front_view_abc123.jpg
    parts = raw_key.split('/')
    if len(parts) < 3:
        logger.error(f'Invalid key format: {raw_key}')
        return
    
    path_prefix = parts[0]  # watches, albums, fishtank
    filename = parts[-1]
    # Reconstruct the path without the filename
    folder_path = '/'.join(parts[:-1])
    
    # Get destination bucket
    dest_bucket = DESTINATION_BUCKETS.get(path_prefix)
    if not dest_bucket:
        logger.error(f'Unknown path prefix: {path_prefix}')
        return
    
    # Determine if this is a thumbnail
    is_thumbnail = filename.lower().startswith('thumbnail')
    
    # Download the raw image
    logger.info(f'Downloading {raw_key} from {raw_bucket}')
    response = _s3.get_object(Bucket=raw_bucket, Key=raw_key)
    image_data = response['Body'].read()
    
    # Process with Pillow
    try:
        img = Image.open(BytesIO(image_data))
        
        # Extract EXIF before any processing
        exif_data = extract_exif(img)
        
        # Convert to RGB if necessary (for WebP compatibility)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Resize and crop based on type
        if is_thumbnail:
            # Crop to target aspect ratio, then resize
            target_ratio = THUMBNAIL_ASPECT_RATIOS.get(path_prefix, (1, 1))
            img = crop_to_aspect_ratio(img, target_ratio)
            img.thumbnail((THUMBNAIL_MAX_SIZE, THUMBNAIL_MAX_SIZE), Image.Resampling.LANCZOS)
        else:
            img.thumbnail((FULL_MAX_SIZE, FULL_MAX_SIZE), Image.Resampling.LANCZOS)
        
        # Save as WebP, preserving EXIF if available
        output_buffer = BytesIO()
        exif_bytes = img.info.get('exif')
        if exif_bytes:
            img.save(output_buffer, 'WEBP', quality=WEBP_QUALITY, exif=exif_bytes)
        else:
            img.save(output_buffer, 'WEBP', quality=WEBP_QUALITY)
        output_buffer.seek(0)
        
        # Determine output filename
        if is_thumbnail:
            output_filename = 'thumbnail.webp'
        else:
            # Keep original name (without extension), add .webp
            name_without_ext = os.path.splitext(filename)[0]
            output_filename = f'{name_without_ext}.webp'
        
        # Build output key - remove the path prefix since dest bucket is type-specific
        # e.g., watches/Seiko/SKX007/file.jpg -> Seiko/SKX007/file.webp
        output_path_parts = parts[1:-1]  # Skip prefix, skip filename
        output_key = '/'.join(output_path_parts) + '/' + output_filename
        
        # Upload processed image to destination bucket
        logger.info(f'Uploading processed image to {dest_bucket}/{output_key}')
        _s3.put_object(
            Bucket=dest_bucket,
            Key=output_key,
            Body=output_buffer.getvalue(),
            ContentType='image/webp'
        )
        
        # Store EXIF data as JSON sidecar (if any EXIF exists)
        if exif_data:
            exif_key = '/'.join(output_path_parts) + '/' + os.path.splitext(output_filename)[0] + '_exif.json'
            logger.info(f'Storing EXIF data to {dest_bucket}/{exif_key}')
            _s3.put_object(
                Bucket=dest_bucket,
                Key=exif_key,
                Body=json.dumps(exif_data, indent=2),
                ContentType='application/json'
            )
        
        # Delete raw file from raw bucket
        logger.info(f'Deleting raw file {raw_bucket}/{raw_key}')
        _s3.delete_object(Bucket=raw_bucket, Key=raw_key)
        
        logger.info(f'Successfully processed {raw_bucket}/{raw_key} -> {dest_bucket}/{output_key}')
        
    except ImportError:
        logger.error('Pillow not available - cannot process image')
        raise
    except Exception as e:
        logger.error(f'Error processing image: {str(e)}')
        raise


def crop_to_aspect_ratio(img, target_ratio):
    """
    Crop image to target aspect ratio from center.
    target_ratio is a tuple (width, height) e.g., (3, 4) for 3:4
    """
    target_w, target_h = target_ratio
    target_aspect = target_w / target_h
    
    img_w, img_h = img.size
    img_aspect = img_w / img_h
    
    if abs(img_aspect - target_aspect) < 0.01:
        # Already correct aspect ratio
        return img
    
    if img_aspect > target_aspect:
        # Image is wider than target - crop width
        new_w = int(img_h * target_aspect)
        left = (img_w - new_w) // 2
        box = (left, 0, left + new_w, img_h)
    else:
        # Image is taller than target - crop height
        new_h = int(img_w / target_aspect)
        top = (img_h - new_h) // 2
        box = (0, top, img_w, top + new_h)
    
    return img.crop(box)


def extract_exif(img):
    """Extract EXIF metadata from an image."""
    try:
        exif_data = {}
        exif = img._getexif()
        
        if not exif:
            return None
        
        for tag_id, value in exif.items():
            tag = TAGS.get(tag_id, tag_id)
            
            # Skip binary/bytes data
            if isinstance(value, bytes):
                continue
            
            # Handle GPS data specially
            if tag == 'GPSInfo':
                gps_data = {}
                for gps_tag_id, gps_value in value.items():
                    gps_tag = GPSTAGS.get(gps_tag_id, gps_tag_id)
                    if not isinstance(gps_value, bytes):
                        gps_data[gps_tag] = str(gps_value)
                exif_data[tag] = gps_data
            else:
                # Convert to string for JSON serialization
                exif_data[tag] = str(value)
        
        return exif_data if exif_data else None
        
    except Exception as e:
        logger.warning(f'Error extracting EXIF: {str(e)}')
        return None


if __name__ == '__main__':
    # Test locally with a mock S3 event
    mock_event = {
        'Records': [{
            's3': {
                'bucket': {'name': 'shendy-watches'},
                'object': {'key': 'raw/watches/Seiko/SKX007/thumbnail_abc123.jpg'}
            }
        }]
    }
    print('This Lambda is triggered by S3 events, not direct invocation')
    print('Mock event:', json.dumps(mock_event, indent=2))
