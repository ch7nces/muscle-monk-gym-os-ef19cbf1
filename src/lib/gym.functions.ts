import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { queryOptions } from "@tanstack/react-query";
import type { Database } from "@/integrations/supabase/types";
import { gymSlug, publicRequestSchema } from "./gym";

export const getPublicGym = createServerFn({ method: "GET" }).handler(async () => {
  const url = process.env['SUPABASE_URL'];
  const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  if (!url || !key) throw new Error("The gym is temporarily unavailable. Please call +91 97559 66358.");
  const client = createClient<Database>(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
      headers.set("apikey", key);
      return fetch(input, { ...init, headers });
    } },
  });
  const { data: gym, error } = await client.from("gyms").select("id, name, name_hi, address, city, state, postal_code, phone, whatsapp").eq("slug", gymSlug).single();
  if (error || !gym) throw new Error("Gym details are temporarily unavailable. Please try again.");
  const [settings, plans, facilities, trainers, reviews, stories, faqs] = await Promise.all([
    client.from("gym_settings").select("hours, hours_confirmed, about_text, trial_slots").eq("gym_id", gym.id).single(),
    client.from("membership_plans").select("id,name,amount,joining_fee,duration_days,features,is_recommended").eq("gym_id", gym.id).eq("is_published", true).not("amount", "is", null).is("archived_at", null).order("sort_order"),
    client.from("facilities").select("id,name,description,image_url").eq("gym_id", gym.id).eq("is_published", true).order("sort_order"),
    client.from("trainers").select("id,full_name,specialization,qualifications,photo_url,photo_path,experience_years").eq("gym_id", gym.id).eq("is_published", true).eq("is_active", true),
    client.from("testimonials").select("id,author_name,quote,rating,source").eq("gym_id", gym.id).eq("is_published", true).eq("consent_confirmed", true),
    client.from("transformation_stories").select("id,title,story,image_url").eq("gym_id", gym.id).eq("is_published", true).eq("consent_confirmed", true),
    client.from("faqs").select("id,question,answer").eq("gym_id", gym.id).eq("is_published", true).order("sort_order"),
  ]);
  if ([settings, plans, facilities, trainers, reviews, stories, faqs].some((result) => result.error)) throw new Error("Website details could not load. Please try again.");
  const publishedTrainers = await Promise.all((trainers.data ?? []).map(async trainer => {
    if (!trainer.photo_path) return trainer;
    const signed = await client.storage.from("gym-photos").createSignedUrl(trainer.photo_path, 3600);
    if (!signed.data) return { ...trainer, photo_url: null };
    const signedUrl = new URL(signed.data.signedUrl);
    const browserUrl = import.meta.env['VITE_SUPABASE_URL'];
    return { ...trainer, photo_url: browserUrl ? `${browserUrl}${signedUrl.pathname}${signedUrl.search}` : signed.data.signedUrl };
  }));
  return { gym, settings: settings.data, plans: plans.data ?? [], facilities: facilities.data ?? [], trainers: publishedTrainers, reviews: reviews.data ?? [], stories: stories.data ?? [], faqs: faqs.data ?? [] };
});

export const publicGymOptions = queryOptions({ queryKey: ["public-gym", gymSlug], queryFn: () => getPublicGym(), staleTime: 60_000 });

export const submitPublicRequest = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => publicRequestSchema.parse(input))
  .handler(async ({ data }) => {
    const url = process.env['SUPABASE_URL'];
    const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
    if (!url || !key) throw new Error("Unable to send your request. Please call the gym.");
    const client = createClient<Database>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
      global: { fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) headers.delete("Authorization");
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      } },
    });
    const { data: result, error } = await client.rpc("submit_public_request", {
      _slug: gymSlug, _kind: data.kind, _name: data.name, _phone: data.phone, _email: data.email,
      _message: data.message, _date: data.kind === "trial" ? data.date : "1970-01-01",
      _slot: data.slot, _consent: data.consent,
    });
    if (error) {
      const allowed = ["Too many requests", "Choose a date", "Choose an available", "You already requested", "This preference is full", "Please check", "Please consent", "Please enter"];
      throw new Error(allowed.some((prefix) => error.message.startsWith(prefix)) ? error.message : "Unable to send your request. Please try again or call the gym.");
    }
    if (!result || typeof result !== "object" || Array.isArray(result) || typeof result['reference'] !== "string") throw new Error("Your request could not be confirmed. Please contact the gym.");
    return { reference: result['reference'] };
  });