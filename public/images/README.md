# Images Directory

## Structure

- **hero/** - Hero section images for the home page
- **albums/** - Album cover images and related photos
- **watches/** - Watch collection photos

## Usage

Images in the `/public` folder can be referenced directly in your code:

```tsx
// Example:
<img src="/images/hero/main.jpg" alt="Hero" />
<img src="/images/albums/album-name.jpg" alt="Album" />
<img src="/images/watches/watch-name.jpg" alt="Watch" />
```

## Recommended Image Formats

- **JPEG** - Photos, complex images
- **PNG** - Images with transparency
- **WebP** - Modern format, smaller file sizes (recommended)

## Optimization Tips

- Compress images before adding them
- Use appropriate dimensions (don't upload 4K images if you only need 1920px wide)
- Consider using WebP format for better performance
