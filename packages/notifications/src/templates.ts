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

const BUTTON = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:linear-gradient(135deg,#6B2CB0,#2E73DC);color:#fff;text-decoration:none;padding:13px 24px;border-radius:999px;font-weight:500;font-size:15px;">${label}</a>`;

export interface Email {
  subject: string;
  html: string;
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
    `),
  };
}
