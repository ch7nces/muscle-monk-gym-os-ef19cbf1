import { createFileRoute } from "@tanstack/react-router";
import { PublicContent } from "@/components/gym/public-content";
import { publicGymOptions } from "@/lib/gym.functions";
import { pageHead } from "@/lib/gym";

export const Route = createFileRoute("/faq")({
  head: () => pageHead("Frequently asked questions", "Find answers about visiting Muscle Monk Gymnasium, trial requests, membership enquiries and contact details."),
  loader: ({ context }) => context.queryClient.ensureQueryData(publicGymOptions),
  component: () => <PublicContent section="faq" />,
});
