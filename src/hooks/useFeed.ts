import useSWRInfinite from "swr/infinite";
import type { ApiResponse, FeedPage, FeedScope } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Paginated feed via keyset cursor. useSWRInfinite stacks pages; getKey returns
// null once there's no nextCursor, which stops further requests.
export function useFeed(scope: FeedScope) {
  const getKey = (
    index: number,
    prev: ApiResponse<FeedPage> | null
  ): string | null => {
    if (prev && !prev.data?.nextCursor) return null; // reached the end
    const cursor = index === 0 ? "" : prev?.data?.nextCursor ?? "";
    const params = new URLSearchParams({ scope });
    if (cursor) params.set("cursor", cursor);
    return `/api/feed?${params.toString()}`;
  };

  const { data, error, isLoading, isValidating, size, setSize, mutate } =
    useSWRInfinite<ApiResponse<FeedPage>>(getKey, fetcher, {
      revalidateFirstPage: false,
    });

  const items = data?.flatMap((p) => p.data?.items ?? []) ?? [];
  const lastPage = data?.[data.length - 1];
  const hasMore = Boolean(lastPage?.data?.nextCursor);
  const isLoadingMore = isValidating && size > 1;

  return {
    items,
    error,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMore: () => setSize(size + 1),
    mutate,
  };
}
