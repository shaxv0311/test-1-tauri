import type { GroupBase, OptionsOrGroups } from "react-select";

export const useCategoryLoader = (trigger: any) => {
  const loadCategoryOptions = async (
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
        options: res?.categories.map(
          (item: { id: number; category: string }) => ({
            value: item.id,
            label: item.category,

            // raw: item,
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

  return { loadCategoryOptions };
};
