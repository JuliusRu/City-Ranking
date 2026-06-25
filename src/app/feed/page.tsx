import { FeedView } from "@/components/feed/FeedView";

export const metadata = {
  title: "Feed · City Ranking",
};

export default function FeedPage() {
  return (
    <div className="mx-auto max-w-2xl p-4 sm:p-6">
      <h1 className="mb-1 text-3xl font-semibold tracking-tight">Feed</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        City ratings from the community and the people you follow.
      </p>
      <FeedView />
    </div>
  );
}
