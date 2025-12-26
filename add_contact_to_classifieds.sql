-- Add contact fields to classified_ads
ALTER TABLE classified_ads 
ADD COLUMN IF NOT EXISTS mobile text,
ADD COLUMN IF NOT EXISTS contact_email text;
