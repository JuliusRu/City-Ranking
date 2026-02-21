import useSWR from "swr";
import type { ApiResponse, StatsData } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useStats() {
  const { data, error, isLoading, mutate } = useSWR<
    ApiResponse<StatsData>
  >("/api/stats", fetcher);

  return {
    stats: data?.data ?? null,
    isLoading,
    error,
    mutate,
  };
}
