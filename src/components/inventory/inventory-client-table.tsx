"use client";

import { useState } from "react";
import { useInventoryItems } from "@/hooks/use-inventory";
import InventoryTable from "@/components/inventory/inventory-table";
import { Loader2 } from "lucide-react";
import { InventoryLoadingState } from "./inventory-loading-state";
import { InventoryErrorState } from "./inventory-error-state";

export default function InventoryClientTable() {
  const [page, setPage] = useState(1);
  const [limit] = useState(20);

  const { data, isLoading, isError, error } = useInventoryItems({
    page,
    limit,
  });

  if (isLoading) {
    return <InventoryLoadingState />;
  }

  if (isError) {
    return <InventoryErrorState error={error} />;
  }

  return (
    <InventoryTable
      items={data?.data || []}
      totalItems={data?.count || 0}
      currentPage={page}
      onPageChange={setPage}
      itemsPerPage={limit}
    />
  );
}
