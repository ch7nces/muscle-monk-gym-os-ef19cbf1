import { createServerFn } from "@tanstack/react-start";
import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const getAccount = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: roles, error } = await context.supabase.from("user_roles").select("role,gym_id,gyms(name)").eq("user_id", context.userId);
  const { data: profile } = await context.supabase.from("profiles").select("full_name,phone").eq("id", context.userId).maybeSingle();
  if (error) throw new Error("Your account details could not load");
  return { roles: roles ?? [], profile };
});
export const accountOptions = queryOptions({ queryKey: ["account"], queryFn: () => getAccount(), staleTime: 30_000 });

export const getEnquiries = createServerFn({ method: "GET" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ gymId: z.string().uuid(), page: z.number().int().min(0) }).parse(input))
  .handler(async ({ data, context }) => {
    const { data: allowed, error: roleError } = await context.supabase.rpc("has_gym_role", { _gym: data.gymId, _roles: ["owner", "manager", "receptionist"] });
    if (roleError || !allowed) throw new Error("You don’t have access to this gym’s enquiries");
    const from = data.page * 20;
    const [trials, enquiries] = await Promise.all([
      context.supabase.from("trial_bookings").select("id,full_name,phone,email,preferred_date,time_slot,fitness_goal,status", { count: "exact" }).eq("gym_id", data.gymId).order("created_at", { ascending: false }).range(from, from + 19),
      context.supabase.from("contact_messages").select("id,full_name,phone,email,message,handled", { count: "exact" }).eq("gym_id", data.gymId).order("created_at", { ascending: false }).range(from, from + 19),
    ]);
    if (trials.error || enquiries.error) throw new Error("Enquiries could not load");
    return { trials: trials.data ?? [], enquiries: enquiries.data ?? [], trialsCount: trials.count ?? 0, enquiriesCount: enquiries.count ?? 0 };
  });

export const updateRequest = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.discriminatedUnion("kind", [
    z.object({ kind: z.literal("trial"), id: z.string().uuid(), gymId: z.string().uuid(), status: z.enum(["pending", "confirmed", "completed", "no_show", "cancelled"]) }),
    z.object({ kind: z.literal("enquiry"), id: z.string().uuid(), gymId: z.string().uuid(), handled: z.boolean() }),
  ]).parse(input))
  .handler(async ({ data, context }) => {
    const { data: allowed } = await context.supabase.rpc("has_gym_role", { _gym: data.gymId, _roles: ["owner", "manager", "receptionist"] });
    if (!allowed) throw new Error("You don’t have permission to update this request");
    const result = data.kind === "trial"
      ? await context.supabase.from("trial_bookings").update({ status: data.status }).eq("id", data.id).eq("gym_id", data.gymId).select("id").single()
      : await context.supabase.from("contact_messages").update({ handled: data.handled }).eq("id", data.id).eq("gym_id", data.gymId).select("id").single();
    if (result.error) throw new Error("This request could not be updated");
    return { ok: true };
  });