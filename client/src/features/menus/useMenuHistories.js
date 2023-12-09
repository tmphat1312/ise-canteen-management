import { useApiParams } from "../../hooks/useApiParams";
import { useQueryFetch } from "../../hooks/useQueryFetch";
import { useQueryPrefetch } from "../../hooks/useQueryPrefetch";
import { getMenuHistories } from "../../services/apiMenuHistories";
import { PAGE_SIZE, QUERY_KEYS } from "../../utils/constants";

export function useMenuHistories() {
  const { page } = useApiParams();

  const queryKey = [QUERY_KEYS.PRODUCTS, page];
  const queryOptions = { page };

  const {
    isLoading,
    error,
    data: { data, count },
  } = useQueryFetch({
    fn: () => getMenuHistories(queryOptions),
    key: queryKey,
  });

  const noPages = Math.ceil(count / PAGE_SIZE);

  useQueryPrefetch({
    fn: () => getMenuHistories({ ...queryOptions, page: page + 1 }),
    key: queryKey.with(1, page + 1),
    when: page < noPages,
  });
  useQueryPrefetch({
    fn: () => getMenuHistories({ ...queryOptions, page: page - 1 }),
    key: queryKey.with(1, page - 1),
    when: page > 1,
  });

  return { isLoading, error, menuHistories: data, count };
}