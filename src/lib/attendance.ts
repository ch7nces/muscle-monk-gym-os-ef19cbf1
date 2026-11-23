import { z } from "zod";
import { indiaDate } from "./gym";

export const entranceSettingsSchema = z.object({ gymId: z.string().uuid(), mode: z.enum(["rotating", "printed"]), latitude: z.number().finite().min(-90).max(90).nullable(), longitude: z.number().finite().min(-180).max(180).nullable(), radius: z.number().int().min(50).max(100), verified: z.boolean() }).refine(v => !v.verified || (v.latitude !== null && v.longitude !== null), "Add verified entrance coordinates first");
export const entranceScanSchema = z.object({ gymId: z.string().uuid(), payload: z.string().min(1).max(150), device: z.string().uuid(), latitude: z.number().finite().min(-90).max(90).nullable(), longitude: z.number().finite().min(-180).max(180).nullable(), accuracy: z.number().finite().min(0).max(100000).nullable(), locationStatus: z.enum(["available", "denied", "unavailable", "timeout"]) });
export const pointSchema = z.object({ id: z.string(), gym_id: z.string(), mode: z.enum(["rotating", "printed"]), latitude: z.number().nullable(), longitude: z.number().nullable(), radius_metres: z.number(), location_verified: z.boolean() });
export const visitSchema = z.object({ id: z.string(), member_id: z.string(), full_name: z.string(), member_status: z.string(), checked_in_at: z.string(), method: z.string(), verification_status: z.string(), staff_override: z.boolean(), override_reason: z.string().nullable() });
export const homeSchema = z.object({ today: z.string(), serverNow: z.string(), staff: z.boolean(), point: pointSchema.nullable(), visits: z.array(visitSchema), attempts: z.array(z.object({ id: z.string(), member_id: z.string(), full_name: z.string(), created_at: z.string(), outcome: z.string(), reason: z.string().nullable(), distance_metres: z.number().nullable(), accuracy_metres: z.number().nullable(), new_session: z.boolean() })), stats: z.object({ total: z.number(), month: z.number(), week: z.number(), today: z.number(), lastVisit: z.string().nullable() }), counts: z.object({ members: z.number(), active: z.number(), expiring: z.number(), leads: z.number() }).nullable() });
export type AttendanceHomeData = z.infer<typeof homeSchema>;
export type Visit = z.infer<typeof visitSchema>;
export function daysRemaining(end: string, today: string) { return Math.ceil((Date.parse(`${end}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000); }
export function attendanceStreak(visits: Visit[], today: string) {
  const days = new Set(visits.map(v => indiaDate(new Date(v.checked_in_at))));
  let cursor = Date.parse(`${today}T12:00:00Z`); let streak = 0;
  if (!days.has(today)) cursor -= 86400000;
  while (days.has(new Date(cursor).toISOString().slice(0, 10))) { streak++; cursor -= 86400000; }
  return streak;
}
export function csvCell(value: string) { return `"${(/^[=+@\-\t\r]/.test(value) ? "'" : "") + value.replaceAll('"', '""')}"`; }
export function visitTime(value: string) { return new Date(value).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata", hour: "2-digit", minute: "2-digit" }); }