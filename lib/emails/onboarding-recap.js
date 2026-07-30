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
 * Email-client constraints honored below (do not "modernize" these away):
 *   - table-based layout, 600px, no flexbox/grid
 *   - all critical styling inline (Gmail/Outlook strip most <style>)
 *   - system font stacks only; web fonts do not load in Outlook
 *   - no background-image, no border-radius dependence, no opacity
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

const INK = '#14181F';
const PAPER = '#EDEFF2';
const CARD = '#FFFFFF';
const RULE = '#DDE1E7';
const MUTED = '#5C6673';
const ACCENT = '#1F4FD8';
const ACCENT_TINT = '#F2F5FD';
const ACCENT_RULE = '#C9D6F7';

const SERIF = "Georgia, 'Times New Roman', Times, serif";
const SANS = "'Helvetica Neue', Helvetica, Arial, sans-serif";

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
 */
function richText(value) {
  const paras = escapeHtml(value.trim())
    .split(/\n{2,}/)
    .map((p) => p.replace(/\n/g, '<br />'))
    .filter((p) => p.trim().length > 0);

  return paras
    .map((para, i) => {
      const gap = i === paras.length - 1 ? '0' : '0 0 12px';
      return `<p style="margin:${gap};font-family:${SERIF};font-size:16px;line-height:1.65;color:#242A33;">${para}</p>`;
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

function answerBlock(label, value) {
  return `
    <tr>
      <td style="padding:0 0 26px;">
        <div style="font-family:${SANS};font-size:12px;font-weight:bold;line-height:1.4;color:${INK};letter-spacing:0.2px;margin:0 0 8px;">${escapeHtml(label)}</div>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          <tr>
            <td style="border-left:3px solid ${ACCENT_RULE};padding:0 0 0 16px;">
              ${richText(value)}
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}

function section(title, blocks) {
  const filled = blocks.filter(Boolean);
  if (filled.length === 0) return '';
  return `
    <tr>
      <td class="pad" style="padding:14px 40px 0;">
        <div style="width:28px;height:2px;background-color:${ACCENT};font-size:0;line-height:0;">&nbsp;</div>
        <div style="font-family:${SANS};font-size:11px;font-weight:bold;letter-spacing:1.6px;text-transform:uppercase;color:${MUTED};padding:12px 0 20px;">${escapeHtml(title)}</div>
        <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
          ${filled.join('')}
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

  return `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light only" />
<meta name="supported-color-schemes" content="light only" />
<title>Your Launch Blueprint</title>
<!--[if mso]><style type="text/css">body,table,td,p,div{font-family:Arial,sans-serif !important;}</style><![endif]-->
<style type="text/css">
  body{margin:0;padding:0;width:100% !important;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;}
  table{border-collapse:collapse;}
  img{border:0;outline:none;text-decoration:none;-ms-interpolation-mode:bicubic;}
  a{color:${ACCENT};}
  @media only screen and (max-width:620px){
    .wrap{width:100% !important;}
    .pad{padding-left:22px !important;padding-right:22px !important;}
    .masthead-title{font-size:28px !important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${PAPER};">

<div style="display:none;font-size:1px;color:${PAPER};line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${escapeHtml(preheader)}</div>

<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${PAPER};">
  <tr>
    <td align="center" style="padding:32px 12px;">

      <table role="presentation" class="wrap" cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;max-width:600px;background-color:${CARD};">

        <tr><td style="height:4px;background-color:${ACCENT};font-size:0;line-height:0;">&nbsp;</td></tr>

        <tr>
          <td class="pad" style="background-color:${INK};padding:34px 40px 30px;">
            <div style="font-family:${SANS};font-size:10px;font-weight:bold;letter-spacing:2.4px;text-transform:uppercase;color:#8B95A3;">Outbound Consulting</div>
            <div class="masthead-title" style="font-family:${SERIF};font-size:34px;line-height:1.15;color:#FFFFFF;padding:14px 0 0;">Your Launch Blueprint</div>
          </td>
        </tr>

        <tr>
          <td class="pad" style="padding:0 40px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="border-bottom:1px solid ${RULE};">
              <tr>
                <td width="60%" style="padding:22px 0 20px;vertical-align:top;">
                  <div style="font-family:${SANS};font-size:10px;font-weight:bold;letter-spacing:1.6px;text-transform:uppercase;color:${MUTED};">Prepared for</div>
                  <div style="font-family:${SERIF};font-size:17px;color:${INK};padding:6px 0 0;">${escapeHtml(company || fullName)}</div>
                </td>
                <td width="40%" style="padding:22px 0 20px;vertical-align:top;">
                  <div style="font-family:${SANS};font-size:10px;font-weight:bold;letter-spacing:1.6px;text-transform:uppercase;color:${MUTED};">Filed</div>
                  <div style="font-family:${SERIF};font-size:17px;color:${INK};padding:6px 0 0;">${escapeHtml(filed)}</div>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td class="pad" style="padding:26px 40px 8px;">
            <p style="margin:0 0 14px;font-family:${SERIF};font-size:17px;line-height:1.6;color:#242A33;">${escapeHtml(firstName)} &mdash; this is everything you told us, in your words.</p>
            <p style="margin:0;font-family:${SERIF};font-size:16px;line-height:1.65;color:${MUTED};">Keep it. It is the source material for the campaigns we are about to build, and ${escapeHtml(specialist)} will work from it on your kickoff call. If anything reads wrong, reply to this email and we will correct it before we write a single line of copy.</p>
          </td>
        </tr>

        ${sections}

        <tr>
          <td class="pad" style="padding:16px 40px 0;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${ACCENT_TINT};">
              <tr>
                <td style="padding:24px 26px;">
                  <div style="font-family:${SANS};font-size:11px;font-weight:bold;letter-spacing:1.6px;text-transform:uppercase;color:${ACCENT};padding:0 0 10px;">What happens next</div>
                  <p style="margin:0;font-family:${SERIF};font-size:16px;line-height:1.65;color:#242A33;">${escapeHtml(nextCopy)} takes it from here. On your kickoff call you will go through this brief together, lock the target list, and sign off on the first sequence. Nothing goes out before you approve it.</p>
                </td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td class="pad" style="padding:30px 40px 36px;">
            <div style="border-top:1px solid ${RULE};padding:20px 0 0;">
              <p style="margin:0;font-family:${SANS};font-size:12px;line-height:1.6;color:${MUTED};">
                Sent to ${escapeHtml(email)} because you completed the Launch Blueprint form.<br />
                Questions? Just reply &mdash; it reaches the team directly.
              </p>
              <p style="margin:14px 0 0;font-family:${SANS};font-size:11px;letter-spacing:1.4px;text-transform:uppercase;color:#98A1AD;">Outbound Consulting</p>
            </div>
          </td>
        </tr>

      </table>

    </td>
  </tr>
</table>

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
