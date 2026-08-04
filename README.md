Passport Photo Print — Simple client-side web app

This repository contains a small offline web app that helps you print multiple passport-photo-sized copies on A4 paper.

How it works
- Upload a single photo (JPG/PNG)
- Enter number of copies (1–60)
- Click "Generate A4 Layout" to create one or more A4 pages with photos arranged automatically
- Click "Print" to open the browser print dialog (uses CSS A4 sizing)

Notes
- The app does not upload images anywhere — it runs entirely in your browser and works offline.
- Photos are scaled to fit each slot without cropping.

To test locally
1. Clone the repo
2. Open index.html in a browser (Chrome/Firefox/Edge)
3. Upload a photo and generate layout

Files added
- index.html
- styles.css
- script.js
- README.md

If you want smaller or larger passport sizes, edit the CSS variables at the top of styles.css (for example --photo-w and --photo-h).