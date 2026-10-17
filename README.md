# Cool Space — Voice Entry (prototype)

Speak Hindi / Hinglish on an Android phone (Chrome) → entry is parsed → you confirm/edit → saved to the Google Sheet **Cool Space Voice Entries** (tabs: Stock, Chamber Readings, Power, Payments, Notes).

100% free: Chrome's built-in speech recognition (`hi-IN`), a rule-based parser (`parser.js`), GitHub Pages, and a Google Apps Script web app (`apps-script/Code.gs`).

## One-time setup (≈5 minutes, on a computer)
1. Open the Sheet "Cool Space Voice Entries" → **Extensions → Apps Script**.
2. Delete what's there, paste all of `apps-script/Code.gs`, click 💾 Save.
3. **Deploy → New deployment** → gear ⚙ → **Web app**. Execute as: **Me**. Who has access: **Anyone**. Click **Deploy**.
4. Click **Authorize access** → choose your Google account → *Advanced* → *Go to … (unsafe)* → **Allow** (it's your own script).
5. Copy the **Web app URL** (ends with `/exec`).
6. On the phone open the page → ⚙️ Settings → paste the URL → Save → *Test connection*.

Entries spoken before step 6 are kept on the phone and sync automatically once the URL is saved.

## Tests
`node tests/parser.test.js && node tests/parser-extra.test.js`
