# Deploying the portfolio + Gemini assistant on Vercel

## Files
- `index.html` — the portfolio site (static)
- `api/chat.js` — serverless function that talks to Gemini, keeping the API key private

## 1. Get a Gemini API key
Go to https://aistudio.google.com/apikey and create a key. Free tier is enough for a personal
portfolio chat widget.

## 2. Push to GitHub
Put `index.html` and the `api/` folder in the root of a repo (no build step needed).

## 3. Import into Vercel
- vercel.com → **Add New Project** → import the repo
- Framework preset: **Other** (it's a static site with one serverless function — Vercel
  auto-detects `api/chat.js`)

## 4. Add the environment variable
Project → **Settings → Environment Variables**:
- Name: `GEMINI_API_KEY`
- Value: (the key from step 1)
- Apply to Production, Preview, and Development

Redeploy after adding it (env vars only apply to new deployments).

## 5. Test
Visit your deployed URL, scroll to **Ask my AI assistant**, and ask a question. If you see
"The assistant isn't configured yet," the env var isn't set or the deployment predates it —
redeploy after confirming the variable.

**Quick health check:** open `https://your-domain.vercel.app/api/chat` directly in the browser
(a plain GET). You should see `{"ok":true,"keyConfigured":true,...}`. If `keyConfigured` is
`false`, the env var isn't set on that deployment. If the page 404s, the function didn't deploy —
check the Vercel build logs.

## 6. If it still doesn't work
Vercel dashboard → your project → **Deployments** → click the latest one → **Functions** tab →
click `api/chat` → **Logs**. Any runtime error (bad API key, quota, etc.) shows up there with
the actual error message.

## Notes
- The API key never reaches the browser — only `/api/chat` (running on Vercel's servers) uses it.
- The function only forwards to Gemini's `generateContent` endpoint with a fixed system prompt
  built from the resume facts, so it can't be redirected to do anything else.
- Model used: `gemini-3.6-flash`. If Google deprecates it later, swap the model name in
  `api/chat.js`.
