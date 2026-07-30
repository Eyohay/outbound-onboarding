/**
 * Launch Blueprint recap email.
 *
 * Renders the client's own onboarding answers back to them as a filed document.
 * Called from app/api/onboarding/route.js AFTER the Airtable write succeeds.
 *
 * Input is the SAME `fields` object already built for the Airtable create call —
 * keyed by Airtable field names. No second naming convention, no mapping layer.
 *
 * This module is a pure function returning a string. It does NOT read from disk,
 * unlike the removed kickoff implementation (commit 731abea) that used
 * fs/process.cwd() and needed the outputFileTracingIncludes block in
 * next.config.js. Do not reintroduce file reads here.
 *
 * Visual system is the kickoff confirmation email — the house template. Source
 * of truth is the Airtable automation that sends it: base appSlS4aXPKvMhSTl,
 * automation wflwk8lx4qgkE8CRq, first node wacHlynmcFPYbXeTg (HTML is inline in
 * that script). Tokens below are copied from it verbatim; if the house template
 * moves, move these with it rather than inventing a variant.
 *
 * Email-client constraints honored below (do not "modernize" these away):
 *   - table-based layout, 600px, no flexbox/grid
 *   - all styling inline; no <style> block at all, same as the kickoff template
 *   - system font stacks only; web fonts do not load in Outlook
 *   - gradients degrade to the bgcolor attribute on the same cell, so every
 *     gradient-bearing <td> also carries bgcolor
 *
 * @typedef {Object} OnboardingFields
 * @property {string}  [Full Name]
 * @property {string}  [Email]
 * @property {string}  [Company]
 * @property {string}  [Business Description]
 * @property {string}  [Ideal Client]
 * @property {string}  [Discovery Questions]
 * @property {string}  [Top 3 Obstacles]
 * @property {string}  [Solutions to Obstacles]
 * @property {string}  [Differentiators]
 * @property {string}  [Client Results]
 * @property {string}  [Most Recognized Client]
 * @property {string}  [Lead Offer]
 * @property {string}  [Offer Improvements]
 * @property {string}  [Additional Notes]
 * @property {string}  [Submitted At]
 */

/* ---- design tokens ------------------------------------------------------ */

const PAPER = '#f7f6f3';
const CARD = '#ffffff';
const BORDER = '#e7e5e0';
const FOOTER = '#15151f';

const NAVY = '#1a1a2e';
const NAVY_LIFT = '#2d2d50';
const ACCENT = '#f26522';
const ACCENT_DEEP = '#d4541a';
const ACCENT_SOFT = '#f9a072';

const TEXT = '#2b2b3a';
const TEXT_SECONDARY = '#44444f';
const MUTED = '#8a8a96';

const FONT =
  "Inter,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

const NAVY_GRAD = `linear-gradient(135deg,${NAVY},${NAVY_LIFT})`;
const ACCENT_GRAD = `linear-gradient(135deg,${ACCENT},${ACCENT_DEEP})`;
const HERO_GRAD =
  `radial-gradient(ellipse 100% 80% at 50% -5%,rgba(242,101,34,0.28) 0%,transparent 65%),` +
  `linear-gradient(180deg,${NAVY_LIFT} 0%,${NAVY} 100%)`;

/* ---- helpers ------------------------------------------------------------ */

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function hasContent(value) {
  return typeof value === 'string' && value.trim().length > 0;
}

/**
 * Escape, then preserve the client's paragraph and line breaks.
 * Every <p> carries the full inline style — Outlook does not reliably
 * inherit font properties into nested block elements.
 *
 * The split/join logic here is load-bearing: a July 30 test confirmed the
 * client's own line breaks survive the form round-trip and render. Restyling
 * may change the values inside the style string; it must not change the shape
 * of the split.
 */
function richText(value) {
  const paras = escapeHtml(value.trim())
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, '<br />'))
    .filter((p) => p.trim().length > 0);

  return paras
    .map((para, i) => {
      const gap = i === paras.length - 1 ? '0' : '0 0 12px';
      return `<p style="margin:${gap};font-family:${FONT};font-size:16px;line-height:1.75;color:${TEXT};">${para}</p>`;
    })
    .join('');
}

function formatFiledDate(submittedAt) {
  const parsed = submittedAt ? new Date(submittedAt) : new Date();
  const date = Number.isNaN(parsed.getTime()) ? new Date() : parsed;
  return date.toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    timeZone: 'America/New_York',
  });
}

/* ---- blocks ------------------------------------------------------------- */

/**
 * One question and the client's answer. The answer sits on the page ground
 * inside the white card, with the accent rule replacing the border on the
 * left edge — so that edge stays square while the other three are rounded.
 */
function answerBlock(label, value) {
  return `
    <tr>
      <td style="padding:0 0 18px;">
        <div style="font-family:${FONT};font-size:14px;font-weight:700;line-height:1.5;color:${NAVY};margin:0 0 9px;">${escapeHtml(label)}</div>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${PAPER}" style="background-color:${PAPER};border:1px solid ${BORDER};border-left:3px solid ${ACCENT};border-radius:0 12px 12px 0;">
          <tr>
            <td style="padding:18px 22px;">
              ${richText(value)}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

/**
 * Section heading plus its answer blocks.
 *
 * The heading has to outrank the answer labels nested under it. At full
 * density — five sections over eleven answers — an 11px muted eyebrow lost to
 * the 14px/700 navy labels beneath it and the section structure stopped
 * reading, so the heading carries ink color, 13px, and a hairline above it.
 * The accent is deliberately not used here: it is already spent on every
 * answer block's left rule, and repeating it a tier up dilutes both.
 */
function section(title, blocks) {
  const filled = blocks.filter(Boolean);
  if (filled.length === 0) return '';
  return `
    <tr>
      <td bgcolor="${CARD}" style="background-color:${CARD};padding:14px 36px 0;">
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="border-top:1px solid ${BORDER};padding:28px 0 0;">
              <div style="font-family:${FONT};font-size:13px;font-weight:700;letter-spacing:1px;text-transform:uppercase;color:${NAVY};margin:0 0 16px;">${escapeHtml(title)}</div>
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
                ${filled.join('')}
              </table>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

/* ---- template ----------------------------------------------------------- */

/**
 * @param {OnboardingFields} fields  The same object passed to the Airtable create.
 * @param {{ specialistName?: string }} [opts]
 * @returns {string} Full HTML document.
 */
function renderOnboardingRecapEmail(fields, opts = {}) {
  const f = fields || {};
  const fullName = hasContent(f['Full Name']) ? f['Full Name'].trim() : '';
  const email = hasContent(f['Email']) ? f['Email'].trim() : '';
  const company = hasContent(f['Company']) ? f['Company'].trim() : '';
  const firstName = fullName.split(/\s+/)[0] || 'there';
  const filed = formatFiledDate(f['Submitted At']);
  const specialist = hasContent(opts.specialistName)
    ? opts.specialistName.trim()
    : 'your launch specialist';

  const pick = (label, key) =>
    hasContent(f[key]) ? answerBlock(label, f[key]) : '';

  const sections = [
    section('The business', [
      pick('What your business does', 'Business Description'),
      pick("Who you're trying to reach", 'Ideal Client'),
    ]),
    section('Your buyers', [
      pick('Questions you ask on a first call', 'Discovery Questions'),
      pick('The three biggest obstacles your clients face', 'Top 3 Obstacles'),
      pick('How you solve them', 'Solutions to Obstacles'),
    ]),
    section('Why you win', [
      pick('What sets you apart', 'Differentiators'),
      pick("Results you've delivered", 'Client Results'),
      pick('Your most recognized client', 'Most Recognized Client'),
    ]),
    section('The offer', [
      pick('Your lead offer', 'Lead Offer'),
      pick("What you'd like to improve about it", 'Offer Improvements'),
    ]),
    section('Also noted', [
      pick('Anything else you wanted us to know', 'Additional Notes'),
    ]),
  ].join('');

  const preheader = company
    ? `Your Launch Blueprint answers for ${company}, filed ${filed}.`
    : `Your Launch Blueprint answers, filed ${filed}.`;

  const nextCopy =
    specialist === 'your launch specialist' ? 'Your launch specialist' : specialist;

  return `<!DOCTYPE html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0">
<meta http-equiv="X-UA-Compatible" content="IE=edge">
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<meta name="x-apple-disable-message-reformatting" />
<title>Your Launch Blueprint</title>
</head>
<body style="margin:0;padding:0;background-color:${PAPER};font-family:${FONT};-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">

<span style="display:none;font-size:1px;color:${PAPER};max-height:0;overflow:hidden;mso-hide:all;">${escapeHtml(preheader)}&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;&nbsp;&#847;&zwnj;</span>

<table width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="${PAPER}">
<tr><td align="center" style="padding:40px 16px;">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">

  <!-- HEADER -->
  <tr>
    <td bgcolor="${NAVY}" style="background:${NAVY_GRAD};padding:22px 36px;border-radius:14px 14px 0 0;color:#ffffff;">
      <table width="100%" cellpadding="0" cellspacing="0" border="0"><tr>
        <td valign="middle">
          <!-- Wordmark is text on purpose. The hosted logo lives at
               https://onboarding.outbound.consulting/outbound-logo.png
               (public/outbound-logo.png) but cannot go here yet: its
               wordmark is rgb(42,45,60), measuring 1.25:1 against this
               header's #1a1a2e and 1.04:1 against the #2d2d50 end of the
               gradient. WCAG large-text minimum is 3:1, so the company
               name renders invisible. Blocked on reversed artwork with a
               white wordmark. The kickoff template hotlinks the same
               image onto the same navy and has the same defect. -->
          <span style="font-family:${FONT};font-size:15px;font-weight:800;letter-spacing:-0.3px;color:#ffffff;">Outbound Consulting</span>
        </td>
        <td align="right" valign="middle">
          <span style="display:inline-block;background:rgba(242,101,34,0.15);border:1px solid rgba(242,101,34,0.35);color:${ACCENT_SOFT};font-size:10px;font-weight:700;letter-spacing:0.8px;text-transform:uppercase;padding:5px 13px;border-radius:100px;font-family:${FONT};white-space:nowrap;">&#9679;&nbsp; Blueprint Filed</span>
        </td>
      </tr></table>
    </td>
  </tr>

  <!-- HERO -->
  <tr>
    <td bgcolor="${NAVY}" style="background:${HERO_GRAD};padding:52px 36px 56px;text-align:center;">
      <table cellpadding="0" cellspacing="0" border="0" align="center" style="margin-bottom:28px;">
        <tr>
          <td width="72" height="72" bgcolor="${ACCENT}" style="background:${ACCENT_GRAD};border-radius:36px;text-align:center;vertical-align:middle;">
            <span style="color:#ffffff;font-size:30px;font-family:Arial,Helvetica,sans-serif;line-height:72px;display:block;font-weight:800;">&#10003;</span>
          </td>
        </tr>
      </table>
      <h1 style="margin:0 0 14px;font-size:36px;font-weight:800;color:#ffffff;line-height:1.08;letter-spacing:-1px;font-family:${FONT};">Your Launch Blueprint</h1>
      <p style="margin:0;font-size:18px;font-weight:600;color:rgba(255,255,255,0.6);line-height:1.4;font-family:${FONT};letter-spacing:-0.3px;">${escapeHtml(firstName)} &mdash; this is everything you told us, in your words.</p>
    </td>
  </tr>

  <!-- Orange stripe -->
  <tr><td bgcolor="${ACCENT}" style="height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>

  <!-- FILING CARD -->
  <tr>
    <td bgcolor="${CARD}" style="background-color:${CARD};padding:32px 36px 8px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${PAPER}" style="background-color:${PAPER};border-radius:12px;border:1px solid ${BORDER};">
        <tr><td style="padding:20px 24px;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
            <td width="60%" valign="top">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${MUTED};text-transform:uppercase;letter-spacing:1px;font-family:${FONT};">Prepared for</p>
              <p style="margin:0;font-size:17px;font-weight:700;color:${NAVY};line-height:1.4;font-family:${FONT};">${escapeHtml(company || fullName)}</p>
            </td>
            <td width="40%" valign="top">
              <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:${MUTED};text-transform:uppercase;letter-spacing:1px;font-family:${FONT};">Filed</p>
              <p style="margin:0;font-size:17px;font-weight:700;color:${NAVY};line-height:1.4;font-family:${FONT};">${escapeHtml(filed)}</p>
            </td>
          </tr></table>
        </td></tr>
      </table>
    </td>
  </tr>

  <!-- INTRO -->
  <tr>
    <td bgcolor="${CARD}" style="background-color:${CARD};padding:24px 36px 4px;">
      <p style="margin:0 0 18px;font-size:16px;color:${TEXT};line-height:1.75;font-family:${FONT};">Hey ${escapeHtml(firstName)},</p>
      <p style="margin:0;font-size:16px;color:${TEXT};line-height:1.75;font-family:${FONT};">Keep it. It is the source material for the campaigns we are about to build, and ${escapeHtml(specialist)} will work from it on your kickoff call. If anything reads wrong, reply to this email and we will correct it before we write a single line of copy.</p>
    </td>
  </tr>

  ${sections}

  <!-- WHAT HAPPENS NEXT -->
  <tr>
    <td bgcolor="${CARD}" style="background-color:${CARD};padding:18px 36px 0;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%" bgcolor="${NAVY}" style="background:${NAVY_GRAD};border-radius:12px;">
        <tr><td style="padding:26px 28px;">
          <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:${ACCENT_SOFT};text-transform:uppercase;letter-spacing:1px;font-family:${FONT};">What happens next</p>
          <p style="margin:0;font-size:15px;color:rgba(255,255,255,0.88);line-height:1.6;font-family:${FONT};">${escapeHtml(nextCopy)} takes it from here. On your kickoff call you will go through this brief together, lock the target list, and sign off on the first sequence. Nothing goes out before you approve it.</p>
        </td></tr>
      </table>
    </td>
  </tr>

  <!-- SIGN-OFF -->
  <tr>
    <td bgcolor="${CARD}" style="background-color:${CARD};padding:32px 36px 36px;">
      <table cellpadding="0" cellspacing="0" border="0" width="100%"><tr>
        <td style="border-top:1px solid ${BORDER};padding-top:24px;">
          <p style="margin:0;font-size:15px;color:${TEXT_SECONDARY};line-height:1.6;font-family:${FONT};">Questions? Just reply &mdash; it reaches the team directly.</p>
        </td>
      </tr></table>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td bgcolor="${FOOTER}" style="background:${FOOTER};padding:24px 36px;border-radius:0 0 14px 14px;">
      <p style="margin:0 0 4px;font-size:12px;color:rgba(255,255,255,0.45);text-align:center;line-height:1.6;font-family:${FONT};">Outbound Consulting</p>
      <p style="margin:0;font-size:11px;color:rgba(255,255,255,0.28);text-align:center;line-height:1.6;font-family:${FONT};">Sent to ${escapeHtml(email)} because you completed the Launch Blueprint form.</p>
    </td>
  </tr>

</table>
</td></tr></table>
</body>
</html>`;
}

/**
 * Plain-text fallback. Always send both parts.
 * @param {OnboardingFields} fields
 * @returns {string}
 */
function renderOnboardingRecapText(fields) {
  const f = fields || {};
  const fullName = hasContent(f['Full Name']) ? f['Full Name'].trim() : '';
  const firstName = fullName.split(/\s+/)[0] || 'there';

  const line = (label, key) =>
    hasContent(f[key]) ? `${label}\n${f[key].trim()}\n\n` : '';

  const group = (title, lines) => {
    const filled = lines.filter(Boolean);
    return filled.length ? `--- ${title} ---\n\n${filled.join('')}` : '';
  };

  return [
    'YOUR LAUNCH BLUEPRINT',
    `Prepared for ${f['Company'] || fullName} | Filed ${formatFiledDate(f['Submitted At'])}`,
    '',
    `${firstName} - this is everything you told us, in your words.`,
    '',
    group('THE BUSINESS', [
      line('What your business does', 'Business Description'),
      line("Who you're trying to reach", 'Ideal Client'),
    ]),
    group('YOUR BUYERS', [
      line('Questions you ask on a first call', 'Discovery Questions'),
      line('The three biggest obstacles your clients face', 'Top 3 Obstacles'),
      line('How you solve them', 'Solutions to Obstacles'),
    ]),
    group('WHY YOU WIN', [
      line('What sets you apart', 'Differentiators'),
      line("Results you've delivered", 'Client Results'),
      line('Your most recognized client', 'Most Recognized Client'),
    ]),
    group('THE OFFER', [
      line('Your lead offer', 'Lead Offer'),
      line("What you'd like to improve about it", 'Offer Improvements'),
    ]),
    group('ALSO NOTED', [
      line('Anything else you wanted us to know', 'Additional Notes'),
    ]),
    'If anything reads wrong, reply to this email and we will correct it.',
    '',
    'Outbound Consulting',
  ]
    .filter((s) => s !== '')
    .join('\n');
}

module.exports = { renderOnboardingRecapEmail, renderOnboardingRecapText };
