import useSWR from "swr";
import type { ApiResponse, CityData, CityOverview } from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useCities() {
  const { data, error, isLoading, mutate } = useSWR<
    ApiResponse<CityData[]>
  >("/api/cities", fetcher);

  return {
    cities: data?.data ?? [],
    isLoading,
    error,
    mutate,
  };
}

export function useCity(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<
    ApiResponse<CityData>
  >(id ? `/api/cities/${id}` : null, fetcher);

  return {
    city: data?.data ?? null,
    isLoading,
    error,
    mutate,
  };
}

export function useCityOverviews() {
  const { data, error, isLoading, mutate } = useSWR<
    ApiResponse<CityOverview[]>
  >("/api/cities?withStats=true", fetcher);

  return {
    cities: data?.data ?? [],
    isLoading,
    error,
    mutate,
  };
}
