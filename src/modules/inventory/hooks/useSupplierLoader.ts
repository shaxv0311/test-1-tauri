import type { GroupBase, OptionsOrGroups } from "react-select";

export const useSupplierLoader = (trigger: any) => {
  const loadSupplierOptions = async (
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
        options: res?.suppliers.map(
          (item: { id: number; supplier_name: string }) => ({
            value: item.id,
            label: item.supplier_name,
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

  return { loadSupplierOptions };
};
