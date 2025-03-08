-- Rename staff_reviewed to labels_printed and update column description
COMMENT ON COLUMN public.inventory_items.editing_locked IS 'When true, the item cannot be edited because labels have been printed';

-- Create a function to print labels for all items in a cubby
CREATE OR REPLACE FUNCTION public.print_cubby_labels_and_lock(cubby_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update all items in the cubby to lock editing
  UPDATE public.inventory_items
  SET editing_locked = true
  WHERE cubby_id = print_cubby_labels_and_lock.cubby_id;
  
  -- Return success
  RETURN true;
END;
$$;

-- Add a policy to allow staff to lock items for editing
DROP POLICY IF EXISTS "Staff can lock items for editing" ON public.inventory_items;
CREATE POLICY "Staff can lock items for editing"
ON public.inventory_items
FOR UPDATE
USING (auth.uid() IN (SELECT id FROM public.users WHERE role IN ('staff', 'admin')))
WITH CHECK ((editing_locked = true));
