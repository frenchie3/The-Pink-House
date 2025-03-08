"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { useState, useEffect } from "react";

interface SelectAllCheckboxProps {
  cubbyId: string;
}

export default function SelectAllCheckbox({ cubbyId }: SelectAllCheckboxProps) {
  const [checked, setChecked] = useState(true);

  const handleChange = (isChecked: boolean) => {
    setChecked(isChecked);

    // Select or deselect all checkboxes for this cubby
    document
      .querySelectorAll(`input[name="item_ids"][data-cubby="${cubbyId}"]`)
      .forEach((checkbox: any) => {
        checkbox.checked = isChecked;

        // Trigger change event to update the React state of child checkboxes
        const event = new Event("change", { bubbles: true });
        checkbox.dispatchEvent(event);
      });
  };

  return (
    <Checkbox
      id={`select-all-${cubbyId}`}
      checked={checked}
      onCheckedChange={handleChange}
    />
  );
}
