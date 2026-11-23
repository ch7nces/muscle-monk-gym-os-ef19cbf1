import { describe, expect, it } from "vitest";
import { indiaDate, publicRequestSchema } from "@/lib/gym";

const enquiry = { kind: "enquiry", name: "Test Visitor", phone: "+91 97559 66358", email: "", message: "I would like to visit", date: "", slot: "", consent: true, website: "" };

describe("Gym public request boundaries", () => {
  it("requires consent before collecting a contact request", () => {
    expect(publicRequestSchema.safeParse({ ...enquiry, consent: false }).success).toBe(false);
    expect(publicRequestSchema.safeParse(enquiry).success).toBe(true);
  });
  it("normalizes the supplied Indian contact format", () => {
    const parsed = publicRequestSchema.parse(enquiry);
    expect(parsed.phone).toBe("+919755966358");
    expect(publicRequestSchema.safeParse({ ...enquiry, phone: "123" }).success).toBe(false);
  });
  it("does not accept a trial without a date and preference", () => {
    expect(publicRequestSchema.safeParse({ ...enquiry, kind: "trial" }).success).toBe(false);
    expect(publicRequestSchema.safeParse({ ...enquiry, kind: "trial", date: "2026-11-21", slot: "Morning" }).success).toBe(true);
  });
  it("uses the gym's Indian date at the UTC day boundary", () => {
    expect(indiaDate(new Date("2026-11-20T20:00:00Z"))).toBe("2026-11-21");
  });
});