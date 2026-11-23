import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { facilitySchema, planSchema, trainerSchema, hoursSchema, memberSchema } from "./management";

export const getManagement = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const db = context.supabase;
  const roles = await db.from("user_roles").select("gym_id,role,gyms(name)").eq("user_id", context.userId);
  const memberships = await db.from("members").select("*").eq("user_id", context.userId);
  const gymIds = [...new Set([...(roles.data ?? []).map(r => r.gym_id), ...(memberships.data ?? []).map(m => m.gym_id)])];
  const [facilities, plans, trainers, settings, members, attendance] = await Promise.all([
    db.from("facilities").select("*").in("gym_id", gymIds).order("sort_order"),
    db.from("membership_plans").select("*").in("gym_id", gymIds).is("archived_at", null).order("sort_order"),
    db.from("trainers").select("*").in("gym_id", gymIds).order("full_name"),
    db.from("gym_settings").select("*").in("gym_id", gymIds),
    db.from("members").select("*").in("gym_id", gymIds).order("full_name").limit(500),
    db.from("attendance").select("*,members(full_name)").in("gym_id", gymIds).order("checked_in_at", { ascending: false }).limit(100),
  ]);
  if ([roles, memberships, facilities, plans, trainers, settings, members, attendance].some(r => r.error)) throw new Error("Gym workspace could not load");
  return { roles: roles.data ?? [], memberships: memberships.data ?? [], facilities: facilities.data ?? [], plans: plans.data ?? [], trainers: trainers.data ?? [], settings: settings.data ?? [], members: members.data ?? [], attendance: attendance.data ?? [] };
});
export const managementOptions = queryOptions({ queryKey: ["management"], queryFn: () => getManagement() });

export const saveFacility = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((v: unknown) => facilitySchema.parse(v)).handler(async ({ data, context }) => {
  const row = { gym_id: data.gymId, name: data.name, description: data.description, is_verified: data.verified, is_published: data.published };
  const result = data.id ? await context.supabase.from("facilities").update(row).eq("id", data.id).eq("gym_id",data.gymId).select("id").single() : await context.supabase.from("facilities").insert(row).select("id").single();
  if (result.error) throw new Error("Facility could not be saved. Owner or manager access is required."); return { ok: true };
});
export const savePlan = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((v: unknown) => planSchema.parse(v)).handler(async ({ data, context }) => {
  const row = { gym_id: data.gymId, name: data.name, duration_days: data.days, amount: data.amount, is_published: data.published };
  const result = data.id ? await context.supabase.from("membership_plans").update(row).eq("id", data.id).eq("gym_id",data.gymId).select("id").single() : await context.supabase.from("membership_plans").insert({ ...row, price: 0 }).select("id").single();
  if (result.error) throw new Error("Plan could not be saved. Owner or manager access is required."); return { ok: true };
});
export const saveTrainer = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((v: unknown) => trainerSchema.parse(v)).handler(async ({ data, context }) => {
  const row = { gym_id: data.gymId, full_name: data.name, specialization: data.specialization, qualifications: data.qualifications, experience_years: data.experience, photo_url: data.photo || null, photo_path: data.photoPath || null, is_active: data.active, is_published: data.published };
  const result = data.id ? await context.supabase.from("trainers").update(row).eq("id", data.id).eq("gym_id",data.gymId).select("id").single() : await context.supabase.from("trainers").insert(row).select("id").single();
  if (result.error) throw new Error("Trainer could not be saved. Owner or manager access is required."); return { ok: true };
});
export const saveHours = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((v: unknown) => hoursSchema.parse(v)).handler(async ({ data, context }) => {
  const result = await context.supabase.from("gym_settings").update({ hours: data.hours, hours_confirmed: data.confirmed }).eq("gym_id",data.gymId).select("gym_id").single();
  if (result.error) throw new Error("Hours could not be saved. Owner or manager access is required."); return { ok: true };
});
export const saveMember = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((v: unknown) => memberSchema.parse(v)).handler(async ({ data, context }) => {
  const row = { gym_id: data.gymId, full_name: data.name, phone: data.phone, email: data.email || null, plan_id: data.plan, starts_on: data.start, ends_on: data.end, status: data.status };
  const result = data.id ? await context.supabase.from("members").update(row).eq("id",data.id).eq("gym_id",data.gymId).select("id").single() : await context.supabase.from("members").insert(row).select("id").single();
  if (result.error) throw new Error("Member could not be saved. Check dates and gym access."); return { id: result.data.id };
});
export const linkMember = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((v: unknown) => z.object({ gymId: z.string().uuid(), id: z.string().uuid(), email: z.string().email() }).parse(v)).handler(async ({ data, context }) => {
  const result = await context.supabase.rpc("link_member_account", { _gym: data.gymId, _member: data.id, _email: data.email });
  if (result.error) throw new Error("Ask this member to sign up and verify the same email first, then link their account."); return { ok: true };
});
export const issueQr = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((v: unknown) => z.object({ gymId: z.string().uuid(), kind: z.enum(["member","entrance"]) }).parse(v)).handler(async ({ data, context }) => {
  const result = await context.supabase.rpc("issue_attendance_token", { _gym: data.gymId, _kind: data.kind });
  if (result.error) throw new Error("QR unavailable. Check active membership or staff access; avoid requesting too often.");
  return z.object({ token: z.string(), expiresAt: z.string(), kind: z.string() }).parse(result.data);
});
export const redeemQr = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((v: unknown) => z.object({ gymId: z.string().uuid(), token: z.string().min(1).max(300) }).parse(v)).handler(async ({ data, context }) => {
  const result = await context.supabase.rpc("redeem_attendance_token", { _gym: data.gymId, _token: data.token });
  if (result.error) throw new Error("Check-in could not be confirmed");
  const parsed = z.object({ error: z.string().optional(), id: z.string().optional(), name: z.string().optional(), checkedInAt: z.string().optional() }).parse(result.data);
  if (parsed.error) throw new Error(parsed.error); return parsed;
});
