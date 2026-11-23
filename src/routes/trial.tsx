import { createFileRoute } from "@tanstack/react-router";
import { PublicContent } from "@/components/gym/public-content";
import { publicGymOptions } from "@/lib/gym.functions";
import { pageHead } from "@/lib/gym";

export const Route = createFileRoute("/trial")({
  head: () => pageHead("Book a free trial", "Request your free trial at Muscle Monk Gymnasium, Rau, Indore. The team will confirm your date and time."),
  loader: ({ context }) => context.queryClient.ensureQueryData(publicGymOptions),
  component: () => <PublicContent section="trial" />,
});
