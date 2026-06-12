import useSWR from "swr";
import type { ApiResponse, VenueData } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useVenues(params?: {
  type?: string;
  sortBy?: string;
  sortOrder?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.type) searchParams.set("type", params.type);
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);

  const query = searchParams.toString();
  const url = `/api/venues${query ? `?${query}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR<ApiResponse<VenueData[]>>(
    url,
    fetcher
  );

  return {
    venues: data?.data ?? [],
    isLoading,
    error,
    mutate,
  };
}

export function useVenue(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<ApiResponse<VenueData>>(
    id ? `/api/venues/${id}` : null,
    fetcher
  );

  return {
    venue: data?.data ?? null,
    isLoading,
    error,
    mutate,
  };
}
