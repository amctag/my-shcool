export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedQuery = {
  page?: number;
  limit?: number;
};
