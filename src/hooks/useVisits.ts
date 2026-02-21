import useSWR from "swr";
import type {
  ApiResponse,
  PaginatedResponse,
  VisitWithCity,
} from "@/types";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useVisits(params?: {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: string;
  cityId?: string;
}) {
  const searchParams = new URLSearchParams();
  if (params?.page) searchParams.set("page", String(params.page));
  if (params?.limit) searchParams.set("limit", String(params.limit));
  if (params?.sortBy) searchParams.set("sortBy", params.sortBy);
  if (params?.sortOrder) searchParams.set("sortOrder", params.sortOrder);
  if (params?.cityId) searchParams.set("cityId", params.cityId);

  const query = searchParams.toString();
  const url = `/api/visits${query ? `?${query}` : ""}`;

  const { data, error, isLoading, mutate } = useSWR<
    ApiResponse<PaginatedResponse<VisitWithCity>>
  >(url, fetcher);

  return {
    visits: data?.data?.items ?? [],
    pagination: data?.data
      ? {
          total: data.data.total,
          page: data.data.page,
          limit: data.data.limit,
          totalPages: data.data.totalPages,
        }
      : null,
    isLoading,
    error,
    mutate,
  };
}

export function useVisit(id: string | null) {
  const { data, error, isLoading, mutate } = useSWR<
    ApiResponse<VisitWithCity>
  >(id ? `/api/visits/${id}` : null, fetcher);

  return {
    visit: data?.data ?? null,
    isLoading,
    error,
    mutate,
  };
}
