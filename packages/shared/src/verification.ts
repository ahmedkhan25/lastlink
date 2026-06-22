// Verification case states + legal transitions. The single highest-stakes
// model in the system — a false release is irreversible. Guards that need DB
// reads live in @lastlink/verification; this is the pure shape both API and
// workers share.

export const CASE_STATES = [
  "initiated",
  "awaiting_second",
  "both_confirmed",
  "safety_hold",
  "release_authorized",
  "releasing",
  "released",
  "cancelled",
  "disputed",
] as const;
export type CaseState = (typeof CASE_STATES)[number];

export const TERMINAL_STATES: readonly CaseState[] = ["released", "cancelled"];

/** Legal transitions. Anything not listed here is rejected. */
export const LEGAL_TRANSITIONS: Record<CaseState, readonly CaseState[]> = {
  initiated: ["awaiting_second", "disputed", "cancelled"],
  awaiting_second: ["both_confirmed", "disputed", "cancelled"],
  both_confirmed: ["safety_hold"],
  safety_hold: ["release_authorized", "cancelled", "disputed"],
  release_authorized: ["releasing"],
  releasing: ["released"],
  released: [],
  cancelled: [],
  disputed: ["safety_hold", "cancelled"],
};

export function isTerminal(state: CaseState): boolean {
  return TERMINAL_STATES.includes(state);
}

export function canTransition(from: CaseState, to: CaseState): boolean {
  return LEGAL_TRANSITIONS[from]?.includes(to) ?? false;
}

/** Decisions an advocate can make on a case. */
export const ADVOCATE_DECISIONS = ["confirm", "dispute", "decline"] as const;
export type AdvocateDecision = (typeof ADVOCATE_DECISIONS)[number];

export const ADVOCATE_SLOTS = ["A", "B"] as const;
export type AdvocateSlot = (typeof ADVOCATE_SLOTS)[number];
