import {
  type CaseState,
  type AdvocateDecision,
  type AdvocateSlot,
  canTransition,
  isTerminal,
} from "@lastlink/shared";

export interface Confirmation {
  slot: AdvocateSlot;
  decision: AdvocateDecision;
}

export interface TransitionResult {
  ok: boolean;
  nextState?: CaseState;
  /** true when this transition should start the 24h safety hold. */
  startsHold?: boolean;
  error?: string;
}

/**
 * Apply one advocate's decision to a case. Pure — the caller persists the
 * confirmation row and the resulting state in one DB transaction.
 *
 * `priorConfirms` excludes this advocate's submission.
 */
export function applyConfirmation(
  state: CaseState,
  priorConfirms: Confirmation[],
  slot: AdvocateSlot,
  decision: AdvocateDecision,
): TransitionResult {
  if (isTerminal(state)) return { ok: false, error: `case is ${state}` };
  if (priorConfirms.some((c) => c.slot === slot)) return { ok: false, error: "advocate already submitted" };

  if (decision === "dispute") {
    return canTransition(state, "disputed")
      ? { ok: true, nextState: "disputed" }
      : { ok: false, error: `cannot dispute from ${state}` };
  }
  if (decision === "decline") {
    // MVP policy: a decline cancels the case (support escalation is post-MVP).
    return canTransition(state, "cancelled")
      ? { ok: true, nextState: "cancelled" }
      : { ok: false, error: `cannot decline from ${state}` };
  }

  // decision === "confirm"
  const confirmsAfter = priorConfirms.filter((c) => c.decision === "confirm").length + 1;
  if (confirmsAfter >= 2) {
    // Second independent confirmation → both_confirmed → safety_hold.
    if (!canTransition(state, "both_confirmed")) return { ok: false, error: `cannot confirm from ${state}` };
    return { ok: true, nextState: "safety_hold", startsHold: true };
  }
  // First confirmation.
  if (!canTransition(state, "awaiting_second")) return { ok: false, error: `cannot confirm from ${state}` };
  return { ok: true, nextState: "awaiting_second" };
}

/** Anyone on the case can cancel until it has released. */
export function canCancel(state: CaseState): boolean {
  return state !== "released" && state !== "cancelled";
}

/**
 * The one time-driven transition. The release worker/endpoint MUST re-check
 * this inside the same DB transaction (after SELECT ... FOR UPDATE), so a
 * cancel landing a millisecond earlier makes the release a no-op.
 */
export function isReleasable(state: CaseState, nowMs: number, holdExpiresAtMs: number | null): boolean {
  return state === "safety_hold" && holdExpiresAtMs != null && nowMs >= holdExpiresAtMs;
}
