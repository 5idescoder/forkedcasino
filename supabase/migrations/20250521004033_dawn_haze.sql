/*
  # Add admin user
  
  1. Changes
    - Update the newly registered user to have admin privileges
*/

DO $$ 
BEGIN
  UPDATE users 
  SET is_admin = true
  WHERE email = 'admin@example.com';
END $$;