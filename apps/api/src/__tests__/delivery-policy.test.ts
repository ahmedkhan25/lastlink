import { describe, expect, it } from "vitest";
import { deliveryStatusForResendEvent, isRecipientAuthorized } from "../delivery-policy.js";
import { parseMessageAudience } from "../audience.js";

describe("message audience input", () => {
  it("defaults to Public and ignores contact ids for Public messages", () => {
    expect(parseMessageAudience({ contactIds: ["5d8cf4d2-8f34-4f30-a21a-0cf55b42c243"] })).toEqual({ audienceType: "public", contactIds: [] });
  });

  it("requires and deduplicates valid contacts for Private messages", () => {
    const id = "5d8cf4d2-8f34-4f30-a21a-0cf55b42c243";
    expect(parseMessageAudience({ audienceType: "private", contactIds: [id, id] })).toEqual({ audienceType: "private", contactIds: [id] });
    expect(() => parseMessageAudience({ audienceType: "private", contactIds: [] })).toThrow("choose at least one private recipient");
    expect(() => parseMessageAudience({ audienceType: "private", contactIds: ["not-a-contact"] })).toThrow("invalid contact selection");
  });
});

describe("release audience policy", () => {
  it("allows opted-in contacts for a public message", () => {
    expect(isRecipientAuthorized("public", true, null)).toBe(true);
    expect(isRecipientAuthorized("public", false, null)).toBe(false);
  });

  it("allows a private message only for explicitly selected contacts", () => {
    expect(isRecipientAuthorized("private", true, "contact-1")).toBe(true);
    expect(isRecipientAuthorized("private", true, null)).toBe(false);
  });
});

describe("Resend delivery states", () => {
  it.each([
    ["email.sent", "sent"],
    ["email.delivery_delayed", "delayed"],
    ["email.delivered", "delivered"],
    ["email.bounced", "bounced"],
    ["email.complained", "complained"],
    ["email.failed", "failed"],
    ["email.suppressed", "failed"],
  ])("maps %s to %s", (event, status) => {
    expect(deliveryStatusForResendEvent(event)).toBe(status);
  });

  it("ignores events that do not change delivery state", () => {
    expect(deliveryStatusForResendEvent("email.opened")).toBeNull();
  });
});
