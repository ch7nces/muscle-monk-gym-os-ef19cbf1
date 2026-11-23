import { describe, expect, it } from "vitest";
import { facilitySchema, planSchema, trainerSchema, memberSchema, hoursSchema, weekDays, MEMBER_QR_SECONDS, ENTRANCE_QR_SECONDS } from "@/lib/management";
const gymId = "a4c7af89-f6be-4be2-8b0f-29290a7eaa01";
describe("gym content and membership rules", () => {
  it("keeps provisional facilities unpublished", () => {
    expect(facilitySchema.safeParse({ gymId, name: "Parking", description: "", verified: false, published: true }).success).toBe(false);
    expect(facilitySchema.safeParse({ gymId, name: "Parking", description: "", verified: false, published: false }).success).toBe(true);
  });
  it("allows unpriced drafts but not published unpriced plans", () => {
    expect(planSchema.safeParse({ gymId, name: "Monthly", days: 30, amount: null, published: false }).success).toBe(true);
    expect(planSchema.safeParse({ gymId, name: "Monthly", days: 30, amount: null, published: true }).success).toBe(false);
  });
  it("does not invent optional trainer experience or a photograph", () => {
    const value = trainerSchema.parse({ gymId, name: "Verified trainer", specialization: "", qualifications: "", experience: null, photo: "", active: true, published: false });
    expect(value.experience).toBeNull(); expect(value.photo).toBe("");
  });
  it("rejects reversed membership dates", () => {
    expect(memberSchema.safeParse({ gymId, name: "Test Member", phone: "9000000000", email: "", plan: null, start: "2026-11-20", end: "2026-11-19", status: "active" }).success).toBe(false);
  });
  it("permits unconfirmed blank hours but requires all times before publication", () => {
    const hours = weekDays.map(day => ({ day, closed: false, open: "", close: "" }));
    expect(hoursSchema.safeParse({ gymId, hours, confirmed: false }).success).toBe(true);
    expect(hoursSchema.safeParse({ gymId, hours, confirmed: true }).success).toBe(false);
  });
  it("uses 60-second member passes", () => { expect(MEMBER_QR_SECONDS).toBe(60); });
  it("uses 30-second entrance passes", () => { expect(ENTRANCE_QR_SECONDS).toBe(30); });
});