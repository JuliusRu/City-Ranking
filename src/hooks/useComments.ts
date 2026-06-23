import useSWR from "swr";
import type { ApiResponse, CommentData } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

// Comments are fetched lazily — only once `enabled` flips true (the user expands
// the thread), so the feed doesn't fire a request per card up front.
export function useComments(visitId: string, enabled: boolean) {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<CommentData[]>>(
    enabled ? `/api/visits/${visitId}/comments` : null,
    fetcher
  );

  return {
    comments: data?.data ?? [],
    isLoading,
    error,
    mutate,
  };
}
