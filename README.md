# GreenPad PWA

A clean black + green personal productivity PWA with:

- Notes: create, edit, delete, search and category filters
- Automatic date/time on notes
- Work-hours start/stop timer and daily session history
- Workout logging and weekly stats
- Dark / bright theme
- Local browser storage
- Offline PWA service worker
- Responsive mobile and desktop interface

## Run locally

Because service workers require a secure context, run the folder through a local server rather than opening `index.html` directly.

### Python
```bash
python -m http.server 8080
```
Then open:
http://localhost:8080

### Node
```bash
npx serve .
```

For a production deployment, upload the files to any HTTPS static host. The app has no backend, so data stays in the user's browser.

## Files

- `index.html` — app structure
- `styles.css` — responsive black/green UI
- `app.js` — notes, work timer, workouts, search and themes
- `manifest.json` — PWA configuration
- `sw.js` — offline caching
- `icon.svg` — app icon
