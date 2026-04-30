# Evolutions! by DJ Vee

SvelteKit archive site for UCLA Radio recordings.

## Getting started

1. Install dependencies with `npm install`
2. Choose one archive source:
3. Local: put recordings in the top-level `archive/` folder
4. Cloudflare: set `ARCHIVE_BUCKET_URL` or `ARCHIVE_MANIFEST_URL`
5. Run `npm run dev`

Nested folders inside `archive/` are supported. The homepage scans for common audio formats like `.mp3`, `.wav`, `.m4a`, `.aac`, `.ogg`, and `.flac`.

## Cloudflare bucket mode

If `ARCHIVE_BUCKET_URL` is set, the site expects `archive-manifest.json` at the bucket root unless `ARCHIVE_MANIFEST_URL` is provided directly.

For this project, a working example is:

```bash
ARCHIVE_BUCKET_URL=https://evobucket.vidhuv.com
```

Example manifest:

```json
{
  "episodes": [
    {
      "key": "2025-10-03-evolutions.mp3",
      "size": "84 MB",
      "title": "First Light"
    },
    {
      "key": "season-2/2025-10-10-evolutions.mp3",
      "size": "79 MB",
      "title": "Signals from Westwood"
    }
  ]
}
```

You can also provide full URLs per item:

```json
[
  {
    "file": "2025-10-03-evolutions.mp3",
    "url": "https://your-public-bucket.example.com/2025-10-03-evolutions.mp3",
    "size": "84 MB"
  }
]
```

## Sorting and custom titles

Episodes are automatically sorted by season and episode number when filenames match patterns like `evs1e1.mp3`, `evs1e10.mp3`, or `season 2 episode 3.mp3`.

You can rename any episode in either of two ways:

1. Add a `title` field in `archive-manifest.json`
2. Edit [src/lib/server/episode-overrides.js](/Users/vidhuv/Documents/Personal/EvSite/src/lib/server/episode-overrides.js) and map a filename to a custom title

Example:

```js
export const episodeOverrides = {
  'evs1e1.mp3': 'Origins',
  'evs1e2.mp3': 'After Hours in Westwood'
};
```
