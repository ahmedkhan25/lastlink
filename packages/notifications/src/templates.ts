// Email templates (inline HTML — warm-bone brand, no external build step).
// Keep copy honest and gentle (PRD §3, §9).

const WRAP = (inner: string) => `
<div style="font-family:-apple-system,'DM Sans',Segoe UI,Roboto,sans-serif;background:#FAF7F1;padding:32px;color:#1F1814;">
  <div style="max-width:520px;margin:0 auto;background:#fff;border:1px solid rgba(31,24,20,0.10);border-radius:18px;padding:36px;">
    <div style="font-family:Georgia,'Cormorant Garamond',serif;font-weight:600;font-size:22px;margin-bottom:24px;">LastLink</div>
    ${inner}
    <div style="margin-top:32px;padding-top:20px;border-top:1px solid rgba(31,24,20,0.08);font-size:12px;color:#7C6A5B;">
      LastLink — verified, dignified delivery. This message was sent because someone designated you. If it wasn't meant for you, you can ignore it.
    </div>
  </div>
</div>`;

// background-color first: Outlook's renderer drops linear-gradient, and without
// a solid fallback the label is white-on-white — an invisible button (seen in
// the wild, 2026-08 partner test). The gradient then upgrades where supported.
const BUTTON = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background-color:#6B2CB0;background:linear-gradient(135deg,#6B2CB0,#2E73DC);color:#ffffff;text-decoration:none;padding:13px 24px;border-radius:999px;font-weight:500;font-size:15px;">${label}</a>`;

// Plain link under the button so the message stays reachable even in clients
// that strip styled anchors entirely.
const FALLBACK_LINK = (href: string) =>
  `<p style="font-size:13px;line-height:1.6;color:#7C6A5B;margin:16px 0 0;word-break:break-all;">
     Button not working? Open this link: <a href="${href}" style="color:#2E73DC;">${href}</a>
   </p>`;

export interface Email {
  subject: string;
  html: string;
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));
}

export function administratorAccessEmail(o: { advocateName: string; registrantName: string; url: string }): Email {
  return {
    subject: `Account administrator access for ${o.registrantName}`,
    html: WRAP(`<h1 style="font-family:Georgia,serif;font-weight:500">${escapeHtml(o.advocateName)}, your administrator access is ready.</h1>
      <p>Both advocates have confirmed ${escapeHtml(o.registrantName)}'s passing and the release has been recorded.</p>
      <p>You are an account administrator, signed in as yourself — not as ${escapeHtml(o.registrantName)}.
      You can manage the memorial and visitor memories, review delivery status, and add contacts to receive already released Public messages.
      Private message contents, private recipient changes, new message authoring and billing are not included.</p>
      ${BUTTON(o.url, "Open account administration")}${FALLBACK_LINK(o.url)}
      <p>This link expires in one hour. For a fresh link, use “Email me my link” on the advocate sign-in page.</p>`),
  };
}

export function advocateInviteEmail(o: { advocateName: string; registrantName: string; acceptUrl: string }): Email {
  return {
    subject: `${o.registrantName} has asked you to be their LastLink advocate`,
    html: WRAP(`
      <h1 style="font-family:Georgia,serif;font-weight:500;font-size:26px;margin:0 0 12px;">${o.advocateName}, you've been entrusted with something important.</h1>
      <p style="font-size:15px;line-height:1.6;color:#44362C;margin:0 0 24px;">
        <strong>${o.registrantName}</strong> has designated you as one of two advocates on LastLink. An advocate is one of two trusted people who, together, confirm a passing before any message is ever released — never one of you alone.
      </p>
      <p style="font-size:15px;line-height:1.6;color:#44362C;margin:0 0 28px;">There's nothing to do today. Accepting simply lets ${o.registrantName} know you're willing.</p>
      ${BUTTON(o.acceptUrl, "Accept this role")}
      ${FALLBACK_LINK(o.acceptUrl)}
    `),
  };
}

export function recipientMessageEmail(o: { recipientName: string; registrantName: string; openUrl: string }): Email {
  return {
    subject: `A message from ${o.registrantName}`,
    html: WRAP(`
      <h1 style="font-family:Georgia,serif;font-weight:500;font-size:26px;margin:0 0 12px;">${o.recipientName} — ${o.registrantName} left this for you.</h1>
      <p style="font-size:15px;line-height:1.6;color:#44362C;margin:0 0 28px;">
        We are so very sorry. ${o.registrantName} recorded this for you, and asked us to deliver it only after it was verified. Take your time. Open it whenever you feel ready.
      </p>
      ${BUTTON(o.openUrl, "Open your message")}
      ${FALLBACK_LINK(o.openUrl)}
    `),
  };
}
