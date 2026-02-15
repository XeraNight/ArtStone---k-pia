-- Drop the existing function if it exists
DROP FUNCTION IF EXISTS get_next_quote_number();

-- Create a function to generate the next quote number
-- This runs with SECURITY DEFINER to bypass RLS
CREATE OR REPLACE FUNCTION get_next_quote_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  current_year INTEGER;
  next_number INTEGER;
  quote_number TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM CURRENT_DATE);
  
  -- Get the highest quote number for the current year
  SELECT COALESCE(
    MAX(
      CAST(
        SUBSTRING(quote_number FROM 'CP-\d{4}-(\d+)') 
        AS INTEGER
      )
    ),
    0
  ) + 1
  INTO next_number
  FROM quotes
  WHERE quote_number LIKE 'CP-' || current_year || '-%';
  
  -- Format the quote number
  quote_number := 'CP-' || current_year || '-' || LPAD(next_number::TEXT, 4, '0');
  
  RETURN quote_number;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_next_quote_number() TO authenticated;
