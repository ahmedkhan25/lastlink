import { describe, it, expect } from "vitest";
import { applyConfirmation, canCancel, canUseDemoReleaseBypass, isReleasable, type Confirmation } from "../index.js";
import { HOLD_DURATION_MS } from "@lastlink/shared";

describe("applyConfirmation", () => {
  it("first confirm → awaiting_second", () => {
    const r = applyConfirmation("initiated", [], "A", "confirm");
    expect(r).toMatchObject({ ok: true, nextState: "awaiting_second" });
    expect(r.startsHold).toBeFalsy();
  });

  it("second (distinct) confirm → safety_hold and starts the hold", () => {
    const prior: Confirmation[] = [{ slot: "A", decision: "confirm" }];
    const r = applyConfirmation("awaiting_second", prior, "B", "confirm");
    expect(r).toMatchObject({ ok: true, nextState: "safety_hold", startsHold: true });
  });

  it("same advocate cannot submit twice", () => {
    const prior: Confirmation[] = [{ slot: "A", decision: "confirm" }];
    expect(applyConfirmation("awaiting_second", prior, "A", "confirm").ok).toBe(false);
  });

  it("dispute → disputed; decline → cancelled", () => {
    expect(applyConfirmation("initiated", [], "A", "dispute")).toMatchObject({ ok: true, nextState: "disputed" });
    expect(applyConfirmation("initiated", [], "A", "decline")).toMatchObject({ ok: true, nextState: "cancelled" });
  });

  it("cannot act on a terminal case", () => {
    expect(applyConfirmation("released", [], "A", "confirm").ok).toBe(false);
    expect(applyConfirmation("cancelled", [], "B", "confirm").ok).toBe(false);
  });
});

describe("safety guards", () => {
  it("uses the approved one-hour safety hold", () => {
    expect(HOLD_DURATION_MS).toBe(60 * 60 * 1000);
  });

  it("cancellable until released", () => {
    expect(canCancel("safety_hold")).toBe(true);
    expect(canCancel("both_confirmed")).toBe(true);
    expect(canCancel("released")).toBe(false);
    expect(canCancel("cancelled")).toBe(false);
  });

  it("isReleasable only when hold elapsed AND still in safety_hold", () => {
    const now = 1_000_000;
    expect(isReleasable("safety_hold", now, now - 1)).toBe(true); // hold elapsed
    expect(isReleasable("safety_hold", now, now + 1)).toBe(false); // not yet
    // THE critical case: a cancel landed first → state moved off safety_hold → no release
    expect(isReleasable("cancelled", now, now - 1)).toBe(false);
    expect(isReleasable("safety_hold", now, null)).toBe(false);
  });

  it("allows an early release only for an explicit request in a demo environment", () => {
    expect(canUseDemoReleaseBypass("safety_hold", true, true)).toBe(true);
    expect(canUseDemoReleaseBypass("safety_hold", false, true)).toBe(false);
    expect(canUseDemoReleaseBypass("safety_hold", true, false)).toBe(false);
    expect(canUseDemoReleaseBypass("cancelled", true, true)).toBe(false);
    expect(canUseDemoReleaseBypass("released", true, true)).toBe(false);
  });
});
