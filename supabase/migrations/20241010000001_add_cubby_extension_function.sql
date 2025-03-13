-- Create a stored procedure to handle cubby rental extensions with potential reassignments
-- This ensures all operations happen in a single transaction for data consistency

CREATE OR REPLACE FUNCTION extend_cubby_rental(
  p_rental_id UUID,
  p_new_end_date TIMESTAMP WITH TIME ZONE,
  p_new_cubby_id UUID,
  p_additional_fee NUMERIC,
  p_is_reassignment BOOLEAN DEFAULT FALSE
) RETURNS VOID AS $$
DECLARE
  v_current_rental RECORD;
  v_current_cubby_id UUID;
  v_current_fee NUMERIC;
  v_seller_id UUID;
BEGIN
  -- Get current rental information
  SELECT cubby_id, rental_fee, listing_type, commission_rate, seller_id
  INTO v_current_rental
  FROM cubby_rentals
  WHERE id = p_rental_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Rental with ID % not found', p_rental_id;
  END IF;
  
  v_current_cubby_id := v_current_rental.cubby_id;
  v_current_fee := v_current_rental.rental_fee;
  v_seller_id := v_current_rental.seller_id;
  
  -- Update the rental record with new end date and increased fee
  UPDATE cubby_rentals
  SET 
    end_date = p_new_end_date,
    rental_fee = v_current_fee + p_additional_fee,
    payment_status = 'paid', -- Auto-set to paid for demo purposes
    updated_at = NOW()
  WHERE id = p_rental_id;
  
  -- If this is a reassignment to a different cubby
  IF p_is_reassignment THEN
    -- Update the cubby_id in the rental record
    UPDATE cubby_rentals
    SET cubby_id = p_new_cubby_id
    WHERE id = p_rental_id;
    
    -- Update the status of the old cubby to available
    UPDATE cubbies
    SET 
      status = 'available',
      updated_at = NOW()
    WHERE id = v_current_cubby_id;
    
    -- Update the status of the new cubby to occupied
    UPDATE cubbies
    SET 
      status = 'occupied',
      updated_at = NOW()
    WHERE id = p_new_cubby_id;
  END IF;
  
  -- Create a notification for the seller about the extension
  INSERT INTO notifications (
    user_id,
    title,
    message,
    type,
    is_read,
    created_at
  )
  VALUES (
    v_seller_id,
    CASE WHEN p_is_reassignment 
      THEN 'Cubby Rental Extended with Reassignment'
      ELSE 'Cubby Rental Extended'
    END,
    CASE WHEN p_is_reassignment 
      THEN 'Your cubby rental has been extended with a new cubby assignment. Please relocate your items to the new cubby.'
      ELSE 'Your cubby rental has been successfully extended.'
    END,
    'rental_extension',
    FALSE,
    NOW()
  );
  
END;
$$ LANGUAGE plpgsql;

-- Enable RLS for notifications table if not already enabled
ALTER TABLE IF EXISTS notifications ENABLE ROW LEVEL SECURITY;

-- Create policy for notifications if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT FROM pg_policies 
    WHERE tablename = 'notifications' AND policyname = 'Users can view their own notifications'
  ) THEN
    CREATE POLICY "Users can view their own notifications" 
    ON notifications FOR SELECT 
    USING (auth.uid() = user_id);
  END IF;
END $$;

-- Add the table to realtime publication if not already added
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime;
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
