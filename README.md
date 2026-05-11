# Outbound Onboarding

Standalone client onboarding page for Outbound Consulting. Clients land here after booking their kickoff call, watch two Vimeo videos, and fill out a 12-question intake form.

On submit, the form:
1. Saves all answers to an Airtable base
2. Sends the client a branded kickoff confirmation email via Brevo

**Live URL:** https://onboarding.outbound.consulting  
**Stack:** Next.js 14, plain JavaScript, CSS Modules  
**Deployed on:** Vercel (auto-deploy from this repo's `main` branch)

---

## Project structure

```
outbound-onboarding/
├── kickoff-email/
│   └── kickoff-confirmation.html   # Source of truth for the confirmation email
├── app/
│   ├── layout.js                   # Bare root layout (html/body wrapper only)
│   ├── onboarding/
│   │   ├── layout.js               # Page title + description metadata
│   │   ├── page.js                 # The onboarding form (multi-step, client component)
│   │   └── onboarding.module.css   # All styles, scoped to the onboarding page
│   └── api/
│       └── onboarding/
│           └── route.js            # POST handler: Airtable write + Brevo email send
├── next.config.js                  # outputFileTracingIncludes so HTML file ships with API route
├── package.json
└── .gitignore
```

---

## Local development

**Prerequisites:** Node.js 22.x, npm

```bash
cd outbound-onboarding
npm install
```

Create a `.env.local` file in the project root with all five env vars (see below). Then:

```bash
npm run dev
```

The onboarding page is at http://localhost:3000/onboarding

Airtable and Brevo calls will fire for real in local dev if env vars are set. To avoid writing test data to the live Airtable base, either use a separate dev base or leave `AIRTABLE_API_KEY` empty — the form will show an error on submit but the UI still works.

---

## Environment variables

All five are required in production. Set them in Vercel → Project Settings → Environment Variables.

| Variable | What it is | Where to get it |
|---|---|---|
| `AIRTABLE_API_KEY` | Personal access token with `data.records:write` scope | airtable.com/create/tokens → create token → scope to the Onboarding base |
| `AIRTABLE_BASE_ID` | The `appXXXXXXXXXX` ID from the Airtable base URL | Open the base → copy the `app...` segment from the URL bar |
| `AIRTABLE_TABLE_NAME` | Name of the table inside the base | Must be `Onboarding` (or whatever you named it — must match exactly) |
| `BREVO_API_KEY` | Brevo transactional email API key | app.brevo.com → Settings → API Keys → Generate |
| `BREVO_SENDER_EMAIL` | The verified sender address that appears in the From field | Must be verified in Brevo → Senders & IPs → Senders before use |

---

## How to edit the kickoff email

The email HTML lives in **`kickoff-email/kickoff-confirmation.html`**. This is the single source of truth — the API route reads it from disk on every request, so any change you make here is live after the next deploy.

- `{{name}}` is the only template variable. It's replaced with the client's first name at send time.
- The CTA button URL is an `<a href="...">` on the orange button near the bottom of the body. Find it and update it if the production URL ever changes.
- To preview the email, open the HTML file directly in a browser. It renders accurately because it uses fully inline styles.
- Do not move the file or rename it without updating the path in `app/api/onboarding/route.js` and the `outputFileTracingIncludes` entry in `next.config.js`.

---

## How to edit the form questions

All form copy — question text, hint text, and placeholder text — is in **`app/onboarding/page.js`**.

Each section has its own component (`Section1Questions`, `Section2Questions`, `Section3Questions`). Inside each, questions are plain JSX with three parts:

```jsx
<div className={s.questionItem}>
  <label className={s.questionLabel}>Q2 — What does your business do?</label>
  <span className={s.questionHint}>Write it the way you'd explain it to someone you just met.</span>
  <textarea
    className={s.questionTextarea}
    placeholder="We help [who] achieve [what] by [how]…"
    value={data.q2}
    onChange={(e) => onChange("q2", e.target.value)}
  />
</div>
```

To change question wording: edit the `<label>` and `<span>` text.  
To change the placeholder: edit the `placeholder` attribute.  
The `value` and `onChange` props should stay wired to the same field key (`q2`, `q3`, etc.) unless you're adding or removing a question entirely.

---

## How to add a new Airtable field

Adding a field requires changes in four places:

**1. Airtable** — Add the field to the `Onboarding` table via the Airtable UI. Name it exactly as you want it to appear.

**2. `app/onboarding/page.js`** — Add the form field UI inside the appropriate section component. Add a new key to the `emptyForm` object at the top of the file:

```js
const emptyForm = {
  // existing keys...
  q13: "",   // your new field
};
```

Then add a `<div className={s.questionItem}>` block for it inside whichever section component makes sense.

**3. `app/api/onboarding/route.js`** — Add the new field to the `fields` object that gets sent to Airtable. The key must match the Airtable field name exactly:

```js
const fields = {
  // existing fields...
  "Your New Field Name": data.q13 || "",
};
```

**4. Test locally** — Submit the form and confirm the new field appears in Airtable with the right value.

---

## Deployment

Vercel is connected to this repo's `main` branch. Every push to `main` triggers an automatic deploy. There is no manual deploy step.

- **Build command:** `next build` (Vercel default)
- **Root directory:** repo root
- **Node version:** 22.x

To deploy a change: commit and push to `main`. Vercel picks it up automatically.

To roll back: use Vercel's Deployments tab to promote any previous deployment to production.
