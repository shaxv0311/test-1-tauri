import type { GroupBase, OptionsOrGroups } from "react-select";

export const useProductLoader = (trigger: any) => {
  const loadProductOptions = async (
    search: string,
    _loadedOptions: OptionsOrGroups<any, GroupBase<any>>,
    additional?: { page: number },
  ) => {
    const page = additional?.page ?? 1;

    try {
      const res = await trigger({
        page,
        search,
        status: "active",
      }).unwrap();

      return {
        options: res?.products.map(
          (item: { id: number; product_name: string }) => ({
            value: item.id,
            label: item.product_name,
            raw: item,
          }),
        ),
        hasMore: page < res.pagination.totalPages,
        additional: { page: page + 1 },
      };
    } catch (e) {
      return {
        options: [],
        hasMore: false,
        additional: { page },
      };
    }
  };

  return { loadProductOptions };
};
