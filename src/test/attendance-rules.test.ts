import { describe, it, expect } from "vitest";
import { attendanceStreak, csvCell, daysRemaining, entranceScanSchema, entranceSettingsSchema, type Visit } from "@/lib/attendance";
const gymId = "a4c7af89-f6be-4be2-8b0f-29290a7eaa01";
describe("entrance attendance rules", () => {
  it("requires owner coordinates before confirming location", () => { expect(entranceSettingsSchema.safeParse({ gymId, mode: "rotating", latitude: null, longitude: null, radius: 75, verified: true }).success).toBe(false); });
  it("limits the configured initial radius to 50–100 metres", () => {
    const point = { gymId, mode: "rotating", latitude: null, longitude: null, verified: false };
    expect(entranceSettingsSchema.safeParse({ ...point, radius: 49 }).success).toBe(false);
    expect(entranceSettingsSchema.safeParse({ ...point, radius: 101 }).success).toBe(false);
    expect(entranceSettingsSchema.safeParse({ ...point, radius: 75 }).success).toBe(true);
  });
  it("rejects non-finite browser location values", () => { expect(entranceScanSchema.safeParse({ gymId, payload: "gymos:point:test", device: gymId, latitude: NaN, longitude: 0, accuracy: 1, locationStatus: "available" }).success).toBe(false); });
  it("calculates expiry from real dates", () => { expect(daysRemaining("2026-11-22", "2026-11-23")).toBe(-1); expect(daysRemaining("2026-11-30", "2026-11-23")).toBe(7); });
  it("counts consecutive visit days without counting duplicates", () => {
    const visit = (date: string): Visit => ({ id: date, member_id: gymId, full_name: "", member_status: "active", checked_in_at: date + "T06:00:00Z", method: "rotating", verification_status: "qr_location", staff_override: false, override_reason: null });
    expect(attendanceStreak([visit("2026-11-22"), visit("2026-11-21"), visit("2026-11-21")], "2026-11-23")).toBe(2);
    expect(attendanceStreak([visit("2026-11-20")], "2026-11-23")).toBe(0);
  });
  it("neutralizes spreadsheet formulas in exported member data", () => { expect(csvCell("=1+1")).toBe('"\'=1+1"'); });
});