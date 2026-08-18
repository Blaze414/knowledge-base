# Article Media

Article media is organised by purpose so source files and generated files stay easy to maintain.

## Folders

- `articles/support/` - source screenshots for customer-support guides
- `articles/store/` - source screenshots for store guides
- `articles/snoopy/` - source photographs used by articles, quizzes, and slideshows
- `articles/lessons/` - remote asset pointer files for lesson media
- `optimized/` - generated responsive WebP files mirroring the source folders

## Adding or replacing an image

1. Add the PNG or JPEG to the appropriate folder under `articles/`.
2. Run `npm run optimize:images`.
3. Import the generated WebP files from the matching folder under `optimized/`.
4. Register the image in `src/content/images.ts` and reference its stable image ID from articles.

Do not edit files under `optimized/` manually. The optimisation command recreates that folder.
