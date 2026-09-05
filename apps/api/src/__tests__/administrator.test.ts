import { describe, expect, it } from "vitest";
import { signAdminToken, verifyAdminToken, hashAdminToken } from "../admin-token.js";
import { passingHeading, emailStatusLabel, type AccountStatus } from "@lastlink/shared";
import { runAdministratorAction } from "../administrator-actions.js";
import { assertMessageAuthoringOpen } from "../audience.js";
import type { PoolClient } from "pg";
const input = {
  id: "a0000000-0000-4000-8000-000000000001",
  advocateId: "a0000000-0000-4000-8000-000000000002",
  caseId: "a0000000-0000-4000-8000-000000000003",
  expiresAt: new Date(Date.now() + 60000),
};
describe("administrator credentials", () => {
  it("is purpose-scoped and reconstructs deterministically for mail retries", () => {
    const t = signAdminToken(input, "test-secret");
    expect(verifyAdminToken(t, "test-secret")?.aud).toBe("lastlink-account-administrator");
    expect(signAdminToken(input, "test-secret")).toBe(t);
    expect(hashAdminToken(t)).toHaveLength(64);
  });
  it("rejects expiry, wrong key, tampering, malformed and legacy tokens", () => {
    const t = signAdminToken(input, "test-secret");
    expect(verifyAdminToken(t, "test-secret", input.expiresAt.getTime() + 1)).toBeNull();
    expect(verifyAdminToken(t, "wrong")).toBeNull();
    for (const bad of [t + "x", "payload.sig", "", "a.b.c.d"]) {
      expect(verifyAdminToken(bad, "test-secret")).toBeNull();
    }
  });
});
describe("administrator action boundary", () => {
  it.each([
    "message-create",
    "message-delete",
    "message-audience",
    "advocate-replace",
    "reset",
    "private-recipient-add",
  ])("rejects %s", async (action) => {
    await expect(runAdministratorAction({} as PoolClient, "any", { action })).rejects.toThrow(
      "not available",
    );
  });
  it.each(["released", "in_verification", "closed"])(
    "blocks owner authoring in %s",
    async (account_state) => {
      const db = { query: async () => ({ rows: [{ account_state }] }) } as unknown as PoolClient;
      await expect(assertMessageAuthoringOpen(db, "any")).rejects.toThrow("read-only");
    },
  );
});
describe("honest status copy", () => {
  it("never equates sent with delivered", () => {
    expect(emailStatusLabel("sent")).toContain("not yet confirmed");
    expect(emailStatusLabel("bounced")).toContain("Bounced");
  });
  it("does not call invitation acceptance a confirmed passing", () => {
    const s = {
      legalName: "Test",
      accountState: "in_verification",
      case: { state: "awaiting_second" },
    } as AccountStatus;
    expect(passingHeading(s)).toBe("Passing verification in progress");
  });
});
