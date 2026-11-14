# Data Model and Field Guide

This guide explains the field meanings that are not always obvious from the code alone.

## 1. Public content records

### Albums

Album records are stored in the `albums` DynamoDB table and surfaced through the public album APIs.

Key fields:

- `AlbumName`: folder key and record ID
- `DisplayName`: human-friendly title
- `Description`: optional descriptive text
- `IsHidden`: hide from public listing
- `ImageCount`: count of images associated with the album
- `LastUpdated`: timestamp used for sorting recent updates
- `Thumbnail`: default thumbnail key if present

### Watches

Watches are stored in the `watch-collection` table.

Key fields:

- `Brand`: watch brand
- `Model`: watch model
- `Enabled`: whether the item should be public
- `Is_Favourite`: favourite highlight status
- `Dial_Colour`, `Case_Width`, `Movement_Type`, etc.: display metadata
- `Description`: long-form notes for detail pages
- `Thumbnail`: selected thumbnail asset key

The API intentionally strips some fields and only returns a lightweight card view when listing items, while the detail endpoint exposes a fuller record.

### Fish tank residents

Resident records are stored in the `fishtank-residents` table.

Key fields:

- `Type`: `fish` or `plant`
- `Id`: identifier within the type
- `Name`: display label
- `ScientificName`: optional scientific name
- `AddedDate`: date the resident was added
- `Status`: `'current'` vs `'past'`
- `IsActive`: whether the resident should be visible publicly
- `Quantity`: count of residents
- `Notes`: descriptive notes
- `Images`: media keys produced by the API layer

### Fish tank timeline

Timeline records are stored in the `fishtank-timeline` table.

Key fields:

- `Id`: event ID
- `Date`: event date
- `Title`: human-friendly label
- `Description`: narrative text
- `EventType`: category such as addition, departure, maintenance, upgrade, or other
- `IsHidden`: whether the event is suppressed from public display
- `Images`: media keys associated with the event

## 2. Operational flags and what they mean

These fields matter more than they look:

- `Enabled` = publish the object to the public site
- `IsHidden` = keep the item in storage but suppress it from public listing
- `IsActive` = indicates active status or visible state for resident or hero content
- `Status` = distinguishes current vs past fish tank residents or timeline context

They are intentionally used as a simple editorial gate rather than a complex approval workflow.

## 3. S3 folder conventions

The application uses predictable folder structure for media content, for example:

- `albums/{AlbumName}/...`
- `watches/{Brand}/{Model}/...`
- `fishtank/{type}/{id}/...`
- `timeline/{event_id}/...`

The code expects filenames and paths to be consistent with these conventions so the API can enumerate files and choose thumbnails and hero assets.

## 4. Data-contract expectations

The public APIs and admin APIs are built around simple JSON contracts:

- list endpoints return arrays or objects with list metadata
- detail endpoints return records keyed by the domain object
- image paths are stored as S3 keys
- the frontend consumes a normalized JSON shape rather than direct DynamoDB objects

This is why changes to a field should usually be accompanied by a matching API and UI update.
