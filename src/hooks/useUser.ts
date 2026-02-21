import useSWR from "swr";
import type { ApiResponse, UserWithSettings } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useUser() {
  const { data, error, isLoading, mutate } = useSWR<
    ApiResponse<UserWithSettings>
  >("/api/user", fetcher);

  return {
    user: data?.data ?? null,
    isLoading,
    error,
    mutate,
  };
}
