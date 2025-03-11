interface InventoryErrorStateProps {
  error: unknown;
}

export function InventoryErrorState({ error }: InventoryErrorStateProps) {
  return (
    <div className="text-center py-12 text-red-500">
      Error loading inventory:{" "}
      {error instanceof Error ? error.message : "Unknown error"}
    </div>
  );
}
