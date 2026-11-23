import { createFileRoute } from "@tanstack/react-router";
import { PublicContent } from "@/components/gym/public-content";
import { publicGymOptions } from "@/lib/gym.functions";
import { pageHead } from "@/lib/gym";

export const Route = createFileRoute("/about")({
  head: () => pageHead("About Muscle Monk", "Visit Muscle Monk Gymnasium in Rau, Indore. Find our gym address and request a trial."),
  loader: ({ context }) => context.queryClient.ensureQueryData(publicGymOptions),
  component: () => <PublicContent section="about" />,
});
