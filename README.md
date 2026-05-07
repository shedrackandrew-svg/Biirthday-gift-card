# Birthday Surprise (static PWA)

This is a minimal static Progressive Web App that:

- Asks for a name and birthday date and stores it in `localStorage`.
- Checks once a minute and shows an in-app surprise modal when today's date matches the saved birthday.
- Uses the Web Notifications API (request permission) to show a notification when a birthday occurs.
- Generates a simple gift card image you can download as PNG.

How to test:

1. Open `index.html` in a modern browser (Chrome/Edge) via a local server. Example (Python 3):

```bash
python -m http.server 8000
```

2. Visit `http://localhost:8000/`.
3. Enter a name and a birthday (set the date to today to test). Click `Save Birthday`.
4. Allow notifications when prompted.
5. Click `Generate Gift Card` to preview and `Download PNG` to save.
6. Optionally install the site as a PWA (browser UI) to add to your phone and receive notifications when the site is open or installed.

Notes & next steps:

- This is a client-only demo. To send push notifications while the browser is closed, you need a server implementing Web Push (VAPID) and a push subscription.
- If you want SMS or background push delivery, I can add a small server (Node/Express) and integration with a provider (Twilio or Push server).
 - I added an optional `server/` Express app that can email the gift card (SMTP) and send WhatsApp messages (Twilio). It saves the generated image and attaches/sends it.

Deployment notes:

- Frontend: host the static site on GitHub Pages (free). Push this repo and enable Pages to serve from `main` or `gh-pages` branch. Alternatively use Vercel or Netlify.
- Backend: the server requires environment variables (SMTP + Twilio). Deploy it to any Node hosting (Render, Railway, Heroku, or Vercel serverless functions). Example env vars:

	- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (for email)
	- `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM` (for WhatsApp API)

After deploying the server, set the `Server API URL` field in the frontend (top form) to `https://your-deployed-server` and click `Send`.

Server files are in the `server/` folder. Install and run locally for testing:

```bash
cd server
npm install
# set env vars in your shell or .env file (not included)
node index.js
```

When ready, deploy the backend to a public host and use that URL in the frontend.

Automatic frontend publishing (GitHub Pages)

- A GitHub Actions workflow is included at `.github/workflows/deploy-pages.yml`. It will publish the repository root to GitHub Pages on every push to `main`.

Serverless (Vercel) option

- There's an `api/send.js` serverless endpoint included for Vercel and similar platforms. It uses `SMTP_*` and `TWILIO_*` env vars. To deploy both frontend and the serverless function together:

	1. Sign in to Vercel and import the GitHub repository.
	2. Set environment variables in the Vercel project settings: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_WHATSAPP_FROM`.
	3. Deploy. Your serverless endpoint will be available at `https://<project>.vercel.app/api/send` — put that URL in the `Server API URL` field in the frontend.

Notes and limitations

- GitHub Pages hosts only static assets. To send emails/WhatsApp you need a server or serverless function (Vercel). The included `server/` app can be deployed to any Node host if you prefer a dedicated server.
- For WhatsApp media messages Twilio requires the media to be publicly accessible; the simple server saves the image and serves it, but serverless functions may require an external storage (S3) or a hosted URL.

Auto-deploying the server with Render (recommended for a simple server)

- Create a new Web Service on Render and connect it to this GitHub repository. Choose the `server/` folder as the root for the service (or deploy the whole repo and set the start command to `node server/index.js`).
- In the Render dashboard, add environment variables for `SMTP_*` and `TWILIO_*` as needed.
- To enable automatic deploys from GitHub Actions (so pushes to `main` trigger a rebuild), add two repository secrets in GitHub Settings > Secrets:
	- `RENDER_API_KEY` — your Render API key (from Render dashboard)
	- `RENDER_SERVICE_ID` — the Render Service ID for your created service
- The included GitHub Actions workflow `.github/workflows/deploy-server-render.yml` will call Render's deploy API when `server/` files change.

Vercel / single-host option recap

- If you prefer Vercel to host both frontend and serverless API, import the repo into Vercel and set environment variables in the project settings. The serverless endpoint is at `/api/send`.

Setting secrets for WhatsApp/media delivery

- Twilio requires media to be publicly reachable for WhatsApp messages. If you're on Render the `server/` app saves uploaded images to `public/uploads` and serves them; ensure your Render service URL is used by the frontend's `Server API URL` field.
