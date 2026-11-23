import { createFileRoute } from "@tanstack/react-router";
import { PublicContent } from "@/components/gym/public-content";
import { publicGymOptions } from "@/lib/gym.functions";
import { pageHead } from "@/lib/gym";

export const Route = createFileRoute("/contact")({
  head: () => pageHead("Contact Muscle Monk", "Contact Muscle Monk Gymnasium at +91 97559 66358 or visit us above Cooperative Bank in Rau, Indore."),
  loader: ({ context }) => context.queryClient.ensureQueryData(publicGymOptions),
  component: () => <PublicContent section="contact" />,
});
