"use client";

import { useEffect } from "react";

export default function PrintLabelsClient() {
  useEffect(() => {
    // Handle select all checkboxes
    const selectAllCheckboxes = document.querySelectorAll<HTMLInputElement>(
      '[id^="select-all-"]',
    );

    selectAllCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", (e: Event) => {
        const cubbyId = checkbox.id.replace("select-all-", "");
        // Type assertion to ensure we have the correct event target type
        const target = e.target as HTMLInputElement;
        const isChecked = target.checked;

        // Select or deselect all checkboxes for this cubby
        document
          .querySelectorAll<HTMLInputElement>(`[data-cubby="${cubbyId}"]`)
          .forEach((itemCheckbox) => {
            itemCheckbox.checked = isChecked;
          });
      });

      // Set initial state to checked
      checkbox.checked = true;
    });

    // Check all checkboxes by default
    document.querySelectorAll<HTMLInputElement>('[name="item_ids"]').forEach((checkbox) => {
      checkbox.checked = true;
    });
  }, []);

  return null;
}
