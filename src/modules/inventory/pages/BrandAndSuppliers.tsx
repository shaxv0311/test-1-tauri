import { useState } from "react";
import Card from "../component/Card";
import { LayoutGrid } from "lucide-react";
import BrandTable from "../component/BrandTable";
import { SupplierTable } from "../component/SupplierTable";
import { CategoryTable } from "../component/CategoryTable";
// import { HiOutlineUserGroup } from "react-icons/hi2";
// import { CiShoppingTag } from "react-icons/ci";
import { useLocation } from "react-router-dom";
import {
  useGetBrandsQuery,
  useGetCategoriesQuery,
  useGetSuppliersQuery,
} from "../../../api/featutres/inventryFeatures/inventryApi/brandCategorySupplierApi";
import { tabsType } from "../../../utils/type";
import CircleLoader from "../../../components/ui/CircleLoader";

type TabType = "brands" | "suppliers" | "categories";
const tabs: tabsType[] = [
  {
    id: "brands",
    label: "Brands",
    // icon: CiShoppingTag,
  },
  {
    id: "suppliers",
    label: "Suppliers",
    // icon: HiOutlineUserGroup,
  },
  {
    id: "categories",
    label: "Categories",
    icon: LayoutGrid,
  },
] as const;

export default function BrandAndSuppliers() {
  const location = useLocation();

  const [activeTab, setActiveTab] = useState<TabType | string>(
    location.state?.activeTab ?? "brands",
  );

  const [brandFilter, setBrandFilter] = useState({
    page: 1,
    limit: 10,
    search: "",
  });
  const [supplierFilter, setSupplierFilter] = useState({
    page: 1,
    limit: 10,
    search: "",
  });
  const [categoryFilter, setCategoryFilter] = useState({
    page: 1,
    limit: 10,
    search: "",
  });

  const {
    data: brandList,
    isLoading: isBrandLoading,
    isFetching: isBrandFetching,
  } = useGetBrandsQuery(brandFilter, { refetchOnMountOrArgChange: true });

  const {
    data: suppliers,
    isLoading: isSupplierLoading,
    isFetching: isSupplierFetching,
  } = useGetSuppliersQuery(supplierFilter, { refetchOnMountOrArgChange: true });

  const {
    data: categories,
    isLoading: isCategoryLoading,
    isFetching: isCategoryFetching,
  } = useGetCategoriesQuery(categoryFilter, {
    refetchOnMountOrArgChange: true,
  });

  const onChangeTab = (tab: tabsType) => () => {
    setActiveTab(tab.id);
  };

  return (
    <div className="flex flex-col gap-3 h-full">
      <Card
        tabs={tabs}
        activeTab={activeTab}
        brandCount={brandList?.pagination.total}
        supplierCount={suppliers?.pagination.total}
        categoryCount={categories?.pagination.total}
        onClick={(tab) => onChangeTab(tab)}
      />

      {isBrandLoading || isSupplierLoading || isCategoryLoading ? (
        <CircleLoader />
      ) : (
        <>
          {activeTab === "brands" && (
            <BrandTable
              data={brandList?.brands}
              pagination={brandList?.pagination}
              filter={brandFilter}
              setFilter={setBrandFilter}
            />
          )}

          {activeTab === "suppliers" && (
            <SupplierTable
              data={suppliers?.suppliers}
              filter={supplierFilter}
              setFilter={setSupplierFilter}
              pagination={suppliers?.pagination}
            />
          )}

          {activeTab === "categories" && (
            <CategoryTable
              data={categories?.categories}
              filter={categoryFilter}
              setFilter={setCategoryFilter}
              pagination={categories?.pagination}
              isFetching={isCategoryFetching}
            />
          )}
        </>
      )}
    </div>
  );
}
