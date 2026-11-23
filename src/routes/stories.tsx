import { createFileRoute } from "@tanstack/react-router";
import { PublicContent } from "@/components/gym/public-content";
import { publicGymOptions } from "@/lib/gym.functions";
import { pageHead } from "@/lib/gym";

export const Route = createFileRoute("/stories")({
  head: () => pageHead("Transformation stories", "Approved member transformation stories from Muscle Monk Gymnasium."),
  loader: ({ context }) => context.queryClient.ensureQueryData(publicGymOptions),
  component: () => <PublicContent section="stories" />,
});
