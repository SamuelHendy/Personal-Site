#!/usr/bin/env python3
"""
One-time script to convert all album thumbnails to webp format.
Matches the standards from image_processor Lambda:
- Square aspect ratio (1:1) for albums
- Max 400px dimension
- WebP quality 90

Run with: python scripts/convert_album_thumbnails.py
"""

import boto3
from io import BytesIO
from PIL import Image

# Use personal profile
session = boto3.Session(profile_name='personal', region_name='eu-west-2')
s3 = session.client('s3')
dynamodb = session.resource('dynamodb')

BUCKET_NAME = 'shendy-albums'
TABLE_NAME = 'albums'

# Match image_processor settings
THUMBNAIL_MAX_SIZE = 400
WEBP_QUALITY = 90


def crop_to_square(img):
    """Crop image to square aspect ratio (center crop)."""
    width, height = img.size
    
    if width == height:
        return img
    
    # Calculate crop box for center crop
    if width > height:
        # Landscape - crop sides
        left = (width - height) // 2
        right = left + height
        top = 0
        bottom = height
    else:
        # Portrait - crop top/bottom
        top = (height - width) // 2
        bottom = top + width
        left = 0
        right = width
    
    return img.crop((left, top, right, bottom))


def convert_thumbnail(album_name, old_thumbnail_key):
    """Download, convert, and upload thumbnail as webp."""
    print(f"  Downloading {old_thumbnail_key}...")
    
    try:
        response = s3.get_object(Bucket=BUCKET_NAME, Key=old_thumbnail_key)
        image_data = response['Body'].read()
    except Exception as e:
        print(f"  ERROR downloading: {e}")
        return None
    
    # Process with Pillow
    img = Image.open(BytesIO(image_data))
    
    # Convert to RGB if necessary
    if img.mode in ('RGBA', 'P'):
        img = img.convert('RGB')
    elif img.mode != 'RGB':
        img = img.convert('RGB')
    
    # Crop to square
    img = crop_to_square(img)
    
    # Resize
    img.thumbnail((THUMBNAIL_MAX_SIZE, THUMBNAIL_MAX_SIZE), Image.Resampling.LANCZOS)
    
    # Save as WebP
    output_buffer = BytesIO()
    img.save(output_buffer, 'WEBP', quality=WEBP_QUALITY)
    output_buffer.seek(0)
    
    # Upload new thumbnail
    new_key = f"{album_name}/thumbnail.webp"
    print(f"  Uploading {new_key}...")
    
    s3.put_object(
        Bucket=BUCKET_NAME,
        Key=new_key,
        Body=output_buffer.getvalue(),
        ContentType='image/webp'
    )
    
    # Delete old thumbnail if different
    if old_thumbnail_key != new_key:
        print(f"  Deleting old {old_thumbnail_key}...")
        s3.delete_object(Bucket=BUCKET_NAME, Key=old_thumbnail_key)
    
    return new_key


def main():
    # Get all album folders
    response = s3.list_objects_v2(Bucket=BUCKET_NAME, Delimiter='/')
    
    table = dynamodb.Table(TABLE_NAME)
    
    for prefix in response.get('CommonPrefixes', []):
        album_name = prefix['Prefix'].rstrip('/')
        
        if 'hidden' in album_name.lower():
            print(f"Skipping hidden album: {album_name}")
            continue
        
        print(f"Processing: {album_name}")
        
        # Find existing thumbnail
        album_response = s3.list_objects_v2(Bucket=BUCKET_NAME, Prefix=f'{album_name}/')
        old_thumbnail = None
        
        for item in album_response.get('Contents', []):
            key = item['Key']
            if 'thumbnail' in key.lower():
                old_thumbnail = key
                break
        
        if not old_thumbnail:
            print(f"  No thumbnail found, skipping")
            continue
        
        # Check if already webp
        if old_thumbnail.endswith('.webp'):
            print(f"  Already webp: {old_thumbnail}")
            new_key = old_thumbnail
        else:
            # Convert
            new_key = convert_thumbnail(album_name, old_thumbnail)
            if not new_key:
                continue
        
        # Update DynamoDB
        print(f"  Updating DynamoDB...")
        table.update_item(
            Key={'AlbumName': album_name},
            UpdateExpression='SET Thumbnail = :t',
            ExpressionAttributeValues={':t': new_key}
        )
        print(f"  Done!")
    
    print("\nAll thumbnails converted!")


if __name__ == '__main__':
    main()
