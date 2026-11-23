import { createFileRoute } from "@tanstack/react-router";
import { PublicContent } from "@/components/gym/public-content";
import { publicGymOptions } from "@/lib/gym.functions";
import { pageHead } from "@/lib/gym";

export const Route = createFileRoute("/facilities")({
  head: () => pageHead("Gym facilities", "Explore confirmed facilities at Muscle Monk Gymnasium or contact the team to arrange a visit."),
  loader: ({ context }) => context.queryClient.ensureQueryData(publicGymOptions),
  component: () => <PublicContent section="facilities" />,
});
