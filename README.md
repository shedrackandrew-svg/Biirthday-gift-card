# Birthday Gift Card (static PWA)

This is a simple static Progressive Web App that:

- Asks for a name and birthday date and stores it in `localStorage`.
- Generates a gift card image you can download as PNG.
- Uses the phone/browser share sheet or WhatsApp/email links when you tap `Send`.

How to test:

1. Open `index.html` in a modern browser (Chrome/Edge) via a local server. Example (Python 3):

```bash
python -m http.server 8000
```

2. Visit `http://localhost:8000/`.
3. Enter a name and a birthday. Click `Save Details`.
4. Click `Generate Gift Card` to preview and `Download PNG` to save.
5. Click `Send` to use the built-in share sheet, or open WhatsApp/email directly if your device supports it.
6. Optionally install the site as a PWA to add it to your phone.

Notes

- No server API is needed for the simple send flow.
- If your browser supports Web Share, `Send` can share the image file directly.
- On browsers without share support, the app falls back to downloading the card and opening WhatsApp/email links.

GitHub Pages

- The site is published from GitHub Pages on every push to `main`.
