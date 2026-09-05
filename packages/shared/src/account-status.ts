export interface AccountStatus {
  legalName: string;
  accountState: string;
  publicMessages: { id: string; title: string | null; type: string }[];
  case: null | {
    id: string;
    state: string;
    reportedDate: string | null;
    confirmedAt: string | null;
    releasedAt: string | null;
    holdExpiresAt: string | null;
    confirmations: { name: string; slot: string; confirmedAt: string }[];
  };
  deliveries: {
    id: string;
    title: string | null;
    type: string;
    recipientName: string;
    email: string;
    status: string;
    sentAt: string | null;
    deliveredAt: string | null;
  }[];
}

export function passingHeading(status: AccountStatus): string {
  if (status.accountState === "released" && status.case?.state === "released")
    return `${status.legalName} has passed`;
  if (status.case?.state === "safety_hold") return "Passing confirmed — safety hold in progress";
  if (status.accountState === "in_verification") return "Passing verification in progress";
  if (status.accountState === "closed") return "Account closed";
  return "Account status";
}

export function emailStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    sent: "Sent — delivery not yet confirmed",
    delivered: "Delivered to mail server",
    bounced: "Bounced — check recipient address",
    failed: "Send failed",
    delayed: "Delivery delayed",
    complained: "Marked as spam",
    queued: "Queued",
  };
  return labels[status] ?? status;
}
