-- Drop existing quotes table if it exists
DROP TABLE IF EXISTS quotes CASCADE;

-- Create enhanced quotes table with categories
CREATE TABLE IF NOT EXISTS quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_text TEXT NOT NULL,
  quote_author TEXT NOT NULL,
  quote_category TEXT DEFAULT 'consciousness',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert the quotes with categories
INSERT INTO quotes (quote_text, quote_author, quote_category) VALUES
('The quieter you become, the more you can hear.', 'Ram Dass', 'consciousness'),
('Surrender is the ultimate strength, not weakness.', 'Michael Singer', 'consciousness'),
('Your mind is a powerful thing. When you fill it with positive thoughts, your life will start to change.', 'Napoleon Hill', 'personal_development'),
('Meditation is not about stopping thoughts, but recognizing that you are more than your thoughts.', 'Eckhart Tolle', 'consciousness'),
('The greatest discovery of all time is that a person can change their future by merely changing their attitude.', 'Oprah Winfrey', 'personal_development'),
('Consciousness is only possible through change; change is only possible through movement.', 'Aldous Huxley', 'consciousness'),
('Silence is the language of God, all else is poor translation.', 'Rumi', 'consciousness'),
('Your inner peace is the greatest weapon against life''s challenges.', 'Thich Nhat Hanh', 'consciousness'),
('The mind is everything. What you think you become.', 'Buddha', 'consciousness'),
('Awareness is the key to transformation.', 'Byron Katie', 'consciousness'),
('Meditation is a way for us to train our mind to be more present and aware.', 'Jack Kornfield', 'consciousness'),
('The only journey is the one within.', 'Rainer Maria Rilke', 'consciousness'),
('Consciousness is not something that happens in you; you are something that happens in consciousness.', 'Rupert Spira', 'consciousness'),
('Personal development is the belief that you are worth the effort, time, and energy needed to develop yourself.', 'Denis Waitley', 'personal_development'),
('The more you know yourself, the more patience you have for what you see in others.', 'Erik Rothacker', 'personal_development'),
('Your thoughts are a bridge between your inner world and outer reality.', 'Wayne Dyer', 'consciousness'),
('Transformation is not about improving yourself, but about letting go of what isn''t authentic.', 'Michael Singer', 'consciousness'),
('Peace comes from within. Do not seek it without.', 'Buddha', 'consciousness'),
('Consciousness is the field of all possibilities.', 'Deepak Chopra', 'consciousness'),
('The present moment is filled with joy and happiness. If you are attentive, you will see it.', 'Thich Nhat Hanh', 'consciousness'),
('When stillness descends, the observer awakens, and you return to your true self.', 'Benjamin Kurtz', 'consciousness'),
('Move slowly, and you''ll navigate life''s path with greater clarity and purpose.', 'Benjamin Kurtz', 'consciousness'),
('Energy and consciousness are one; our human journey is to remember and return home.', 'Benjamin Kurtz', 'consciousness');

-- Create policy for quotes
DROP POLICY IF EXISTS "Allow read access to quotes" ON quotes;
CREATE POLICY "Allow read access to quotes" ON quotes FOR SELECT USING (true);

-- Enable RLS
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
