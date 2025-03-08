"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";

interface CheckboxRowProps {
  id: string;
  value: string;
  cubbyId: string;
  defaultChecked?: boolean;
}

export default function CheckboxRow({
  id,
  value,
  cubbyId,
  defaultChecked = true,
}: CheckboxRowProps) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <Checkbox
      id={id}
      name="item_ids"
      value={value}
      data-cubby={cubbyId}
      checked={checked}
      onCheckedChange={(isChecked) => setChecked(!!isChecked)}
    />
  );
}
