-- Allow users to delete their own messages (needed for clear chat)
CREATE POLICY "Users can delete own messages"
ON public.messages
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM chat_sessions cs
  WHERE cs.id = messages.session_id AND cs.user_id = auth.uid()
));