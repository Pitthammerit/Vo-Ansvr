-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  text TEXT NOT NULL,
  author TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the quotes
INSERT INTO quotes (text, author) VALUES
('The quieter you become, the more you can hear.', 'Ram Dass'),
('Surrender is the ultimate strength, not weakness.', 'Michael Singer'),
('Your mind is a powerful thing. When you fill it with positive thoughts, your life will start to change.', 'Napoleon Hill'),
('Meditation is not about stopping thoughts, but recognizing that you are more than your thoughts.', 'Eckhart Tolle'),
('The greatest discovery of all time is that a person can change their future by merely changing their attitude.', 'Oprah Winfrey'),
('Consciousness is only possible through change; change is only possible through movement.', 'Aldous Huxley'),
('Silence is the language of God, all else is poor translation.', 'Rumi'),
('Your inner peace is the greatest weapon against life''s challenges.', 'Thich Nhat Hanh'),
('The mind is everything. What you think you become.', 'Buddha'),
('Awareness is the key to transformation.', 'Byron Katie'),
('Meditation is a way for us to train our mind to be more present and aware.', 'Jack Kornfield'),
('The only journey is the one within.', 'Rainer Maria Rilke'),
('Consciousness is not something that happens in you; you are something that happens in consciousness.', 'Rupert Spira'),
('Personal development is the belief that you are worth the effort, time, and energy needed to develop yourself.', 'Denis Waitley'),
('The more you know yourself, the more patience you have for what you see in others.', 'Erik Rothacker'),
('Your thoughts are a bridge between your inner world and outer reality.', 'Wayne Dyer'),
('Transformation is not about improving yourself, but about letting go of what isn''t authentic.', 'Michael Singer'),
('Peace comes from within. Do not seek it without.', 'Buddha'),
('Consciousness is the field of all possibilities.', 'Deepak Chopra'),
('The present moment is filled with joy and happiness. If you are attentive, you will see it.', 'Thich Nhat Hanh'),
('When stillness descends, the observer awakens, and you return to your true self.', 'Benjamin Kurtz'),
('Move slowly, and you''ll navigate life''s path with greater clarity and purpose.', 'Benjamin Kurtz'),
('Energy and consciousness are one; our human journey is to remember and return home.', 'Benjamin Kurtz');

-- Create policy for quotes
CREATE POLICY "Allow read access to quotes" ON quotes FOR SELECT USING (true);
