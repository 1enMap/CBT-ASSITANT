/*
  # Add starred chats support
  
  1. Changes
    - Add `is_starred` column to chat_history table
    - Add `is_new_chat` column to chat_history table to track new/existing chats
  
  2. Security
    - Maintain existing RLS policies
*/

ALTER TABLE chat_history 
ADD COLUMN IF NOT EXISTS is_starred boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_new_chat boolean DEFAULT true;