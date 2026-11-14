# Content Authoring and Publishing Guide

This guide explains the practical workflow for managing the public site content through the admin app.

## 1. Editorial model

There is not a formal approval pipeline in the repo, but the admin app is the content management layer. The site is edited through admin forms and backed by Lambda APIs and S3 content buckets rather than direct database editing.

The practical model is:

- create or edit content in the admin UI
- save the record through the admin API
- upload images through the image upload flow
- publish or reveal content by setting the relevant `Enabled` or `IsHidden` field

## 2. How to add an album

The album editor is in [admin/src/pages/Albums.tsx](../../admin/src/pages/Albums.tsx).

Typical flow:

1. open the Albums admin screen
2. click Add Album
3. fill in the album metadata
4. save the album
5. use the image management modal to upload photos
6. review the album in the public site after deploy

Album records are backed by the admin albums API and the public album list/detail APIs.

### Album intent

The album record is intended to represent a collection of images grouped under a folder name and display metadata.

Key album concepts:

- `AlbumName`: unique folder key used by the S3 bucket and public detail route
- `DisplayName`: user-facing label shown in the UI
- `IsHidden`: hides the album from public listing
- `LastUpdated`: date used for sorting and recent updates

## 3. How to upload images to an album

The image upload flow is implemented in [admin/src/components/ImageManagementModal.generic.tsx](../../admin/src/components/ImageManagementModal.generic.tsx).

The flow works like this:

1. the admin UI builds a content path such as `albums/{AlbumName}` or `watches/{Brand}/{Model}`
2. it requests a signed upload URL from the image upload API
3. it uploads the file directly to S3
4. a background status poll checks whether processing is complete
5. the detail API refreshes the image list after processing

This pattern is used for albums, watches, and fish tank content.

## 4. How to add or edit a watch

The watches editor is in [admin/src/pages/Watches.tsx](../../admin/src/pages/Watches.tsx).

Typical workflow:

1. add a watch with `Brand` and `Model`
2. fill in the metadata fields used by the public watch cards and detail pages
3. set `Enabled` to publish it to the site
4. optionally mark `Is_Favourite`
5. upload images and a thumbnail

### Watch intent

The watch content model is meant to be a product record for a single watch item with:

- brand and model as the identity
- display metadata such as dial color, movement, year, and condition
- one hero or thumbnail image
- a list of supporting images

## 5. How to manage the fish tank content

The fish tank admin screen is in [admin/src/pages/Fishtank.tsx](../../admin/src/pages/Fishtank.tsx).

It supports three major content areas:

- residents
- timeline
- hero image

### Residents

Residents are grouped by type:

- `fish` or `plant` in the API layer
- the admin UI exposes them as current or past residents and provides notes/metadata

### Timeline events

Timeline items are records with:

- `Id`
- `Date`
- `Title`
- `EventType`
- `Description`
- optional images

These are meant to represent fish tank milestones or changes over time.

### Hero image

The hero section supports a set of uploaded hero files and allows one active file to be chosen as the current page hero.

## 6. Practical publishing rules

The app uses a few key flags to decide whether content is visible:

- `Enabled`: used for watch publication
- `IsHidden`: used for album visibility
- `IsActive`: used for fish tank resident visibility or state
- `Status`: used to distinguish current or past residents

These flags are not purely cosmetic; they affect what the public frontend displays.

## 7. Content lifecycle expectations

The intent is:

1. create the record
2. upload media
3. validate the item in admin
4. publish by toggling visibility state
5. deploy the merged app if the content update is part of the release flow

This is intentionally lightweight and human-driven rather than a formal editorial pipeline.
