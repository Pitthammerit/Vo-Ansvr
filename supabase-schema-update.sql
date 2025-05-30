ALTER TABLE responses
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Optional: Create a policy to allow users to insert/update/delete their own responses
-- You might already have a general policy, but this is good practice for RLS.
CREATE POLICY "Users can manage their own responses" ON responses
FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
