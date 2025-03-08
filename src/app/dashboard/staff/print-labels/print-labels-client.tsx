"use client";

import { useEffect } from "react";

export default function PrintLabelsClient() {
  useEffect(() => {
    // Handle select all checkboxes
    const selectAllCheckboxes = document.querySelectorAll(
      '[id^="select-all-"]',
    );

    selectAllCheckboxes.forEach((checkbox) => {
      checkbox.addEventListener("change", (e) => {
        const cubbyId = checkbox.id.replace("select-all-", "");
        const isChecked = e.target.checked;

        // Select or deselect all checkboxes for this cubby
        document
          .querySelectorAll(`[data-cubby="${cubbyId}"]`)
          .forEach((itemCheckbox) => {
            itemCheckbox.checked = isChecked;
          });
      });

      // Set initial state to checked
      checkbox.checked = true;
    });

    // Check all checkboxes by default
    document.querySelectorAll('[name="item_ids"]').forEach((checkbox) => {
      checkbox.checked = true;
    });
  }, []);

  return null;
}
