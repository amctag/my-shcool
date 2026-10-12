/**
 * Default number of records fetched per page by School Admin list pages.
 *
 * The backend accepts up to 100 items per page (`@Max(100)` on dashboard
 * query DTOs), so the dashboard requests full 100-record pages instead of
 * the previous 10-record pages.
 */
export const DEFAULT_PAGE_SIZE = 100;
