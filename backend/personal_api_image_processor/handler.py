import json
import logging
import os
import urllib.parse
from datetime import datetime
import boto3
from io import BytesIO
from PIL import Image
from PIL.ExifTags import TAGS, GPSTAGS

logger = logging.getLogger(__name__)
logger.setLevel(logging.INFO)

_s3 = None
_dynamodb = None

# Raw bucket (source) and destination buckets
RAW_BUCKET = os.environ.get('RAW_BUCKET', 'shendy-raw')
ALBUMS_TABLE = os.environ.get('ALBUMS_TABLE', 'albums')

# Map path prefix to destination bucket
DESTINATION_BUCKETS = {
    'watches': os.environ.get('WATCHES_BUCKET', 'shendy-watches'),
    'albums': os.environ.get('ALBUMS_BUCKET', 'shendy-albums'),
    'fishtank': os.environ.get('FISHTANK_BUCKET', 'shendy-fishtank'),
}

# WebP quality settings
THUMBNAIL_MAX_SIZE = 600  # Max dimension for thumbnails (card view)
HERO_MAX_SIZE = 2000  # Max dimension for hero images (expanded view)
FULL_MAX_SIZE = 2000  # Max dimension for full images (albums)
WEBP_QUALITY = 95  # Default quality for lossy compression

# Thumbnail aspect ratios by type (width:height)
THUMBNAIL_ASPECT_RATIOS = {
    'watches': (3, 4),    # Portrait
    'albums': (1, 1),     # Square
    'fishtank': (16, 9),  # Landscape
}

# Hero aspect ratio for fishtank (matches FishTankHero.tsx aspect-[11/5])
FISHTANK_HERO_ASPECT_RATIO = (11, 5)


def save_webp(img, exif_bytes=None, lossless=False):
    """Save image as WebP, either lossy or lossless."""
    buffer = BytesIO()
    if lossless:
        # Lossless WebP - no quality parameter needed
        if exif_bytes:
            img.save(buffer, 'WEBP', lossless=True, exif=exif_bytes)
        else:
            img.save(buffer, 'WEBP', lossless=True)
    else:
        # Lossy WebP with quality setting
        if exif_bytes:
            img.save(buffer, 'WEBP', quality=WEBP_QUALITY, exif=exif_bytes)
        else:
            img.save(buffer, 'WEBP', quality=WEBP_QUALITY)
    buffer.seek(0)
    return buffer


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
            # S3 event notifications URL-encode the key (+ for space, %XX for special chars)
            key = urllib.parse.unquote_plus(record['s3']['object']['key'])
            
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
    
    # Download the raw image and check for lossless metadata
    logger.info(f'Downloading {raw_key} from {raw_bucket}')
    response = _s3.get_object(Bucket=raw_bucket, Key=raw_key)
    image_data = response['Body'].read()
    
    # Check if lossless compression was requested via metadata
    metadata = response.get('Metadata', {})
    use_lossless = metadata.get('lossless', '').lower() == 'true'
    if use_lossless:
        logger.info('Lossless compression requested')
    
    # Process with Pillow
    try:
        img = Image.open(BytesIO(image_data))
        
        # Extract EXIF before any processing (save raw bytes too, as convert() loses them)
        exif_data = extract_exif(img)
        exif_bytes = img.info.get('exif')
        
        # Convert to RGB if necessary (for WebP compatibility)
        if img.mode in ('RGBA', 'P'):
            img = img.convert('RGB')
        elif img.mode != 'RGB':
            img = img.convert('RGB')
        
        # Build output path - remove the path prefix since dest bucket is type-specific
        # e.g., watches/Seiko/SKX007/file.jpg -> Seiko/SKX007/
        output_path_parts = parts[1:-1]  # Skip prefix, skip filename
        output_path = '/'.join(output_path_parts) + '/'
        
        # Process based on type
        if is_thumbnail:
            # For thumbnails, generate BOTH thumbnail (cropped) and hero (full res)
            # This gives us a small image for cards and a large one for expanded view
            
            # 1. Create thumbnail (cropped to aspect ratio, smaller size)
            # Thumbnails are always lossy for smaller file size
            target_ratio = THUMBNAIL_ASPECT_RATIOS.get(path_prefix, (1, 1))
            thumb_img = crop_to_aspect_ratio(img.copy(), target_ratio)
            thumb_img.thumbnail((THUMBNAIL_MAX_SIZE, THUMBNAIL_MAX_SIZE), Image.Resampling.LANCZOS)
            
            thumb_buffer = save_webp(thumb_img, exif_bytes, lossless=False)
            
            thumb_key = output_path + 'thumbnail.webp'
            logger.info(f'Uploading thumbnail to {dest_bucket}/{thumb_key}')
            _s3.put_object(
                Bucket=dest_bucket,
                Key=thumb_key,
                Body=thumb_buffer.getvalue(),
                ContentType='image/webp'
            )
            
            # 2. Create hero image (full resolution, no crop)
            # Hero can be lossless if requested
            hero_img = img.copy()
            hero_img.thumbnail((HERO_MAX_SIZE, HERO_MAX_SIZE), Image.Resampling.LANCZOS)
            
            hero_buffer = save_webp(hero_img, exif_bytes, lossless=use_lossless)
            
            hero_key = output_path + 'hero.webp'
            logger.info(f'Uploading hero image to {dest_bucket}/{hero_key} (lossless={use_lossless})')
            _s3.put_object(
                Bucket=dest_bucket,
                Key=hero_key,
                Body=hero_buffer.getvalue(),
                ContentType='image/webp'
            )
            
            output_key = thumb_key  # For logging
        else:
            # Regular image (not thumbnail)
            # Check if this is a fishtank hero image - needs cropping to 11:5
            is_fishtank_hero = path_prefix == 'fishtank' and 'hero' in parts
            
            if is_fishtank_hero:
                # Crop to 11:5 aspect ratio for fishtank hero
                img = crop_to_aspect_ratio(img, FISHTANK_HERO_ASPECT_RATIO)
                logger.info(f'Cropped fishtank hero to 11:5 aspect ratio')
            
            # Resize to max size
            img.thumbnail((FULL_MAX_SIZE, FULL_MAX_SIZE), Image.Resampling.LANCZOS)
            
            output_buffer = save_webp(img, exif_bytes, lossless=use_lossless)
            
            # Keep original name (without extension), add .webp
            name_without_ext = os.path.splitext(filename)[0]
            # Prefix with EXIF date if available (for sorting) - but not for hero images
            if not is_fishtank_hero:
                date_prefix = get_exif_date_prefix(exif_data)
                if date_prefix:
                    output_filename = f'{date_prefix}_{name_without_ext}.webp'
                else:
                    output_filename = f'{name_without_ext}.webp'
            else:
                output_filename = f'{name_without_ext}.webp'
            
            output_key = output_path + output_filename
            
            logger.info(f'Uploading processed image to {dest_bucket}/{output_key}')
            _s3.put_object(
                Bucket=dest_bucket,
                Key=output_key,
                Body=output_buffer.getvalue(),
                ContentType='image/webp'
            )
        
        # Store EXIF data as JSON sidecar (if any EXIF exists)
        # For thumbnails, store alongside hero image; for regular images, use output_filename
        if exif_data:
            if is_thumbnail:
                exif_key = output_path + 'hero_exif.json'
            else:
                exif_key = output_path + os.path.splitext(output_filename)[0] + '_exif.json'
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
        
        # Clean up empty folders in raw bucket
        cleanup_empty_folders(raw_bucket, folder_path)
        
        # Update album metadata in DynamoDB if this is an album image
        if path_prefix == 'albums':
            album_name = parts[1]  # albums/{album_name}/...
            logger.info(f'Updating album metadata for {album_name} (is_thumbnail={is_thumbnail})')
            update_album_metadata(album_name, dest_bucket)
        
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


def cleanup_empty_folders(bucket, folder_path):
    """
    Check if the folder is empty after processing, and if so, clean up.
    Works up the folder tree to remove any empty parent folders.
    e.g., watches/Seiko/SKX007 -> check SKX007, then Seiko, then watches
    """
    try:
        parts = folder_path.split('/')
        
        # Check each level from deepest to shallowest
        for i in range(len(parts), 0, -1):
            current_path = '/'.join(parts[:i])
            prefix = f'{current_path}/'
            
            # List objects in this folder
            response = _s3.list_objects_v2(Bucket=bucket, Prefix=prefix, MaxKeys=1)
            
            if response.get('KeyCount', 0) == 0:
                # Folder is empty - nothing to delete (S3 doesn't have real folders)
                logger.info(f'Folder {current_path}/ is now empty')
            else:
                # Folder still has files, stop cleaning up
                break
                
    except Exception as e:
        # Don't fail the whole process if cleanup fails
        logger.warning(f'Error during folder cleanup: {str(e)}')


def get_exif_date_prefix(exif_data):
    """
    Extract datetime from EXIF data and format as YYYY-MM-DD_HHMMSS for filename prefix.
    Returns None if no date found.
    """
    if not exif_data:
        return None
    
    # Try DateTimeOriginal first (when photo was taken), then DateTime
    date_str = exif_data.get('DateTimeOriginal') or exif_data.get('DateTime')
    
    if not date_str:
        return None
    
    try:
        # EXIF date format is typically "YYYY:MM:DD HH:MM:SS"
        parts = date_str.split(' ')
        date_part = parts[0].replace(':', '-')  # YYYY-MM-DD
        if len(parts) > 1:
            time_part = parts[1].replace(':', '')  # HHMMSS
            return f'{date_part}_{time_part}'
        return date_part
    except Exception:
        return None


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


def update_album_metadata(album_name, albums_bucket):
    """
    Update album ImageCount and LastUpdated in DynamoDB after processing an image.
    Counts all non-thumbnail images in the album folder.
    """
    global _dynamodb
    if _dynamodb is None:
        _dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('AWS_REGION', 'eu-west-2'))
    
    try:
        # Count images in the album (excluding thumbnails and JSON sidecars)
        logger.info(f'Listing objects in {albums_bucket}/{album_name}/')
        response = _s3.list_objects_v2(Bucket=albums_bucket, Prefix=f'{album_name}/')
        
        image_count = 0
        for item in response.get('Contents', []):
            key = item['Key']
            if key.endswith('/') or 'thumbnail' in key.lower():
                continue
            if key.endswith(('.webp', '.jpg', '.jpeg', '.png')):
                image_count += 1
                logger.info(f'Counting image: {key}')
        
        logger.info(f'Total image count for {album_name}: {image_count}')
        
        # Update DynamoDB
        table = _dynamodb.Table(ALBUMS_TABLE)
        now = datetime.utcnow().strftime('%Y-%m-%d')
        
        logger.info(f'Updating DynamoDB table {ALBUMS_TABLE} for album {album_name}')
        table.update_item(
            Key={'AlbumName': album_name},
            UpdateExpression='SET ImageCount = :count, LastUpdated = :updated',
            ExpressionAttributeValues={
                ':count': image_count,
                ':updated': now
            }
        )
        
        logger.info(f'Successfully updated album {album_name}: ImageCount={image_count}, LastUpdated={now}')
        
    except Exception as e:
        # Don't fail the whole process if metadata update fails
        logger.warning(f'Error updating album metadata: {str(e)}')


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
