"use client";

import { useState, useEffect } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Printer } from "lucide-react";

interface ItemCheckboxProps {
  id: string;
  value: string;
  cubbyId: string;
}

export function ItemCheckbox({ id, value, cubbyId }: ItemCheckboxProps) {
  const [checked, setChecked] = useState(true);

  // Update the select all checkbox when individual items change
  const updateSelectAll = () => {
    const allCheckboxes = document.querySelectorAll(
      `input[name="item_ids"][data-cubby="${cubbyId}"]`,
    );
    const checkedCheckboxes = document.querySelectorAll(
      `input[name="item_ids"][data-cubby="${cubbyId}"]:checked`,
    );
    const selectAllCheckbox = document.getElementById(
      `select-all-${cubbyId}`,
    ) as HTMLInputElement;

    if (selectAllCheckbox) {
      selectAllCheckbox.checked =
        allCheckboxes.length === checkedCheckboxes.length;
      selectAllCheckbox.indeterminate =
        checkedCheckboxes.length > 0 &&
        checkedCheckboxes.length < allCheckboxes.length;
    }

    // Dispatch a custom event to notify the PrintButton component
    const countUpdateEvent = new CustomEvent("selection-changed", {
      detail: { cubbyId, count: checkedCheckboxes.length },
      bubbles: true,
    });
    document.dispatchEvent(countUpdateEvent);
  };

  useEffect(() => {
    // Update select all checkbox when this checkbox changes
    if (checked !== undefined) {
      updateSelectAll();
    }
  }, [checked, cubbyId]);

  return (
    <Checkbox
      id={id}
      name="item_ids"
      value={value}
      data-cubby={cubbyId}
      checked={checked}
      onCheckedChange={(isChecked) => {
        setChecked(!!isChecked);
        // Force update the count immediately
        setTimeout(() => updateSelectAll(), 0);
      }}
    />
  );
}

interface SelectAllCheckboxProps {
  cubbyId: string;
}

export function SelectAllCheckbox({ cubbyId }: SelectAllCheckboxProps) {
  const [checked, setChecked] = useState(true);
  const [indeterminate, setIndeterminate] = useState(false);

  // Initialize checkboxes and update select all state
  useEffect(() => {
    const updateSelectAllState = () => {
      const allCheckboxes = document.querySelectorAll(
        `input[name="item_ids"][data-cubby="${cubbyId}"]`,
      );
      const checkedCheckboxes = document.querySelectorAll(
        `input[name="item_ids"][data-cubby="${cubbyId}"]:checked`,
      );

      // Update state based on checkbox counts
      setChecked(
        allCheckboxes.length > 0 &&
          allCheckboxes.length === checkedCheckboxes.length,
      );
      setIndeterminate(
        checkedCheckboxes.length > 0 &&
          checkedCheckboxes.length < allCheckboxes.length,
      );
    };

    // Set all checkboxes to checked initially
    document
      .querySelectorAll(`input[name="item_ids"][data-cubby="${cubbyId}"]`)
      .forEach((checkbox: any) => {
        checkbox.checked = true;

        // Add change event listener to update select all state
        checkbox.addEventListener("change", updateSelectAllState);
      });

    // Initial state update
    updateSelectAllState();

    // Cleanup event listeners
    return () => {
      document
        .querySelectorAll(`input[name="item_ids"][data-cubby="${cubbyId}"]`)
        .forEach((checkbox: any) => {
          checkbox.removeEventListener("change", updateSelectAllState);
        });
    };
  }, [cubbyId]);

  const handleChange = (isChecked: boolean) => {
    setChecked(isChecked);
    setIndeterminate(false);

    // Select or deselect all checkboxes for this cubby
    document
      .querySelectorAll(`input[name="item_ids"][data-cubby="${cubbyId}"]`)
      .forEach((checkbox: any) => {
        checkbox.checked = isChecked;

        // Trigger change event to update the React state of child checkboxes
        const event = new Event("change", { bubbles: true });
        checkbox.dispatchEvent(event);
      });

    // Directly dispatch a custom event to update the count
    const checkedCount = isChecked
      ? document.querySelectorAll(
          `input[name="item_ids"][data-cubby="${cubbyId}"]`,
        ).length
      : 0;

    const countUpdateEvent = new CustomEvent("selection-changed", {
      detail: { cubbyId, count: checkedCount },
      bubbles: true,
    });
    document.dispatchEvent(countUpdateEvent);
  };

  return (
    <Checkbox
      id={`select-all-${cubbyId}`}
      checked={checked}
      data-indeterminate={indeterminate}
      // Use HTMLInputElement type for checkbox ref to handle indeterminate state
      // The indeterminate property is only available on checkbox input elements
      ref={(ref: HTMLDivElement | null) => {
        // The underlying checkbox element is an HTMLInputElement
        const inputRef = ref?.querySelector('input') as HTMLInputElement | null;
        if (inputRef) {
          inputRef.indeterminate = indeterminate;
        }
      }}
      onCheckedChange={(isChecked: boolean) => handleChange(isChecked)}
    />
  );
}

interface PrintButtonProps {
  cubbyId: string;
}

export function PrintButton({ cubbyId }: PrintButtonProps) {
  const [error, setError] = useState<string | null>(null);
  const [selectedCount, setSelectedCount] = useState(0);

  // Function to manually count selected checkboxes
  const countSelectedCheckboxes = () => {
    const selectedCheckboxes = document.querySelectorAll(
      `input[name="item_ids"][data-cubby="${cubbyId}"]:checked`,
    );
    return selectedCheckboxes.length;
  };

  // Keep track of selected items count
  useEffect(() => {
    // Initial count calculation
    const calculateInitialCount = () => {
      setSelectedCount(countSelectedCheckboxes());
    };

    // Run initial count after a short delay to ensure all checkboxes are rendered
    setTimeout(calculateInitialCount, 100);

    // Listen for custom selection-changed events
    const handleSelectionChanged = (event: any) => {
      if (event.detail && event.detail.cubbyId === cubbyId) {
        setSelectedCount(event.detail.count);
      }
    };

    // Add event listener for the custom event
    document.addEventListener("selection-changed", handleSelectionChanged);

    // Also add a direct listener for checkbox changes as a fallback
    const handleDirectChanges = () => {
      setSelectedCount(countSelectedCheckboxes());
    };

    // Add direct change listeners to all checkboxes
    const checkboxes = document.querySelectorAll(
      `input[name="item_ids"][data-cubby="${cubbyId}"]`,
    );
    checkboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", handleDirectChanges);
    });

    // Also listen to the select all checkbox
    const selectAllCheckbox = document.getElementById(`select-all-${cubbyId}`);
    if (selectAllCheckbox) {
      selectAllCheckbox.addEventListener("change", handleDirectChanges);
    }

    // Set up a polling interval as a last resort fallback
    const intervalId = setInterval(() => {
      const currentCount = countSelectedCheckboxes();
      if (currentCount !== selectedCount) {
        setSelectedCount(currentCount);
      }
    }, 500);

    return () => {
      // Cleanup event listeners
      document.removeEventListener("selection-changed", handleSelectionChanged);

      // Remove direct change listeners
      checkboxes.forEach((checkbox) => {
        checkbox.removeEventListener("change", handleDirectChanges);
      });

      if (selectAllCheckbox) {
        selectAllCheckbox.removeEventListener("change", handleDirectChanges);
      }

      // Clear interval
      clearInterval(intervalId);
    };
  }, [cubbyId, selectedCount]);

  const handleSubmit = (e: React.FormEvent) => {
    // Force a recount of selected checkboxes
    const currentCount = countSelectedCheckboxes();

    // Check if any checkboxes are selected
    if (currentCount === 0) {
      e.preventDefault();
      setError("Please select at least one item");

      // Clear error after 3 seconds
      setTimeout(() => setError(null), 3000);
    } else {
      // Make sure the form actually submits
      // No need to prevent default here
      console.log(`Submitting form with ${currentCount} items selected`);
    }
  };

  return (
    <div className="flex flex-col items-end">
      {error && (
        <div
          className="text-red-500 text-sm mb-2"
          style={{ opacity: 1, transition: "opacity 0.3s ease-in-out" }}
        >
          {error}
        </div>
      )}
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-500">
          {selectedCount} item{selectedCount !== 1 ? "s" : ""} selected
        </span>
        <Button
          type="submit"
          className="bg-pink-600 hover:bg-pink-700"
          onClick={handleSubmit}
        >
          <Printer className="mr-2 h-4 w-4" />
          Print Labels & Lock Items
        </Button>
      </div>
    </div>
  );
}
