import { z } from "zod";

export const gymSlug = "muscle-monk";
export const gymId = "a4c7af89-f6be-4be2-8b0f-29290a7eaa01";
export const whatsappUrl = "https://wa.me/919755966358";
export const mapsUrl = "https://www.google.com/maps/search/?api=1&query=Muscle+Monk+Gymnasium+Rau+Indore";

export function indiaDate(now = new Date()) {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Kolkata", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
}

export const publicRequestSchema = z.object({
  kind: z.enum(["trial", "enquiry"]),
  name: z.string().trim().min(2, "Enter your full name").max(120),
  phone: z.string().trim().transform((s) => s.replace(/[\s()-]/g, "")).pipe(z.string().regex(/^\+?[0-9]{10,15}$/, "Enter a valid phone number")),
  email: z.union([z.literal(""), z.string().trim().email("Enter a valid email").max(254)]),
  message: z.string().trim().max(2000),
  date: z.string(),
  slot: z.string().max(80),
  consent: z.boolean().refine(Boolean, "Please agree to be contacted about your request"),
  website: z.string().max(0),
}).superRefine((value, ctx) => {
  if (value.kind === "enquiry" && value.message.length < 5) ctx.addIssue({ code: "custom", path: ["message"], message: "Tell us a little about your enquiry" });
  if (value.kind === "trial" && !/^\d{4}-\d{2}-\d{2}$/.test(value.date)) ctx.addIssue({ code: "custom", path: ["date"], message: "Choose your preferred date" });
  if (value.kind === "trial" && !value.slot) ctx.addIssue({ code: "custom", path: ["slot"], message: "Choose a time preference" });
});

export type PublicRequest = z.input<typeof publicRequestSchema>;

export function pageHead(title: string, description: string) {
  const fullTitle = `${title} — Muscle Monk Gymnasium`;
  return { meta: [
    { title: fullTitle }, { name: "description", content: description },
    { property: "og:title", content: fullTitle }, { property: "og:description", content: description },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary_large_image" },
  ] };
}