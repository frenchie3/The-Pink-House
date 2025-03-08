-- Remove staff_reviewed field references and update editing_locked field description

COMMENT ON COLUMN public.inventory_items.editing_locked IS 'When true, the item cannot be edited because labels have been printed';

-- Create a function to print labels and lock editing
CREATE OR REPLACE FUNCTION public.print_labels_and_lock(item_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update the item to lock editing
  UPDATE public.inventory_items
  SET editing_locked = true
  WHERE id = item_id;
  
  -- Return success
  RETURN true;
END;
$$;

-- Add a policy to allow staff to lock items
DROP POLICY IF EXISTS "Staff can lock items for editing" ON public.inventory_items;
CREATE POLICY "Staff can lock items for editing"
ON public.inventory_items
FOR UPDATE
USING (auth.uid() IN (SELECT id FROM public.users WHERE role IN ('staff', 'admin')))
WITH CHECK ((editing_locked = true));
