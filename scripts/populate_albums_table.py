#!/usr/bin/env python3
"""
One-time script to populate the albums DynamoDB table with existing S3 album data.
Run with: python scripts/populate_albums_table.py
"""

import boto3
from datetime import datetime

# Use personal profile
session = boto3.Session(profile_name='personal', region_name='eu-west-2')
s3 = session.client('s3')
dynamodb = session.resource('dynamodb')

BUCKET_NAME = 'shendy-albums'
TABLE_NAME = 'albums'

def get_album_data(album_name):
    """Get image count and last updated date for an album."""
    paginator = s3.get_paginator('list_objects_v2')
    
    images = []
    last_updated = None
    
    for page in paginator.paginate(Bucket=BUCKET_NAME, Prefix=f'{album_name}/'):
        for item in page.get('Contents', []):
            key = item['Key']
            # Skip folders, thumbnails, and hidden
            if key.endswith('/'):
                continue
            if 'thumbnail' in key.lower():
                continue
            if 'hidden' in key.split('/'):
                continue
            
            images.append(item)
            
            # Track most recent modification
            if last_updated is None or item['LastModified'] > last_updated:
                last_updated = item['LastModified']
    
    return {
        'ImageCount': len(images),
        'LastUpdated': last_updated.strftime('%d/%m/%Y') if last_updated else 'n/a'
    }

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
        
        album_data = get_album_data(album_name)
        
        item = {
            'AlbumName': album_name,
            'DisplayName': None,  # Use AlbumName by default
            'Description': None,
            'IsHidden': False,
            'ImageCount': album_data['ImageCount'],
            'LastUpdated': album_data['LastUpdated']
        }
        
        table.put_item(Item=item)
        print(f"  -> {album_data['ImageCount']} images, last updated: {album_data['LastUpdated']}")
    
    print("\nDone!")

if __name__ == '__main__':
    main()
