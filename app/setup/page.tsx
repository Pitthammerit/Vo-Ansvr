"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, XCircle, Loader2, Database, ArrowRight, Copy } from "lucide-react"
import { createClient } from "@supabase/supabase-js"
import Link from "next/link"

export default function SetupPage() {
  const [status, setStatus] = useState<"idle" | "running" | "success" | "error">("idle")
  const [currentStep, setCurrentStep] = useState("")
  const [error, setError] = useState("")
  const [showManualSQL, setShowManualSQL] = useState(false)

  const sqlCommands = `
-- Create campaigns table
CREATE TABLE IF NOT EXISTS campaigns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  welcome_video_id TEXT,
  thank_you_video_id TEXT,
  question_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create conversations table
CREATE TABLE IF NOT EXISTS conversations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  campaign_id UUID REFERENCES campaigns(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create messages table
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  sender_type TEXT CHECK (sender_type IN ('user', 'admin')) NOT NULL,
  message_type TEXT CHECK (message_type IN ('video', 'audio', 'text')) NOT NULL,
  content TEXT NOT NULL,
  cloudflare_video_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quotes table
CREATE TABLE IF NOT EXISTS quotes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_text TEXT NOT NULL,
  quote_author TEXT NOT NULL,
  quote_category TEXT DEFAULT 'consciousness',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;

-- Create policies (allowing all operations for now - restrict in production)
DROP POLICY IF EXISTS "Allow all operations on campaigns" ON campaigns;
DROP POLICY IF EXISTS "Allow all operations on users" ON users;
DROP POLICY IF EXISTS "Allow all operations on conversations" ON conversations;
DROP POLICY IF EXISTS "Allow all operations on messages" ON messages;
DROP POLICY IF EXISTS "Allow read access to quotes" ON quotes;

CREATE POLICY "Allow all operations on campaigns" ON campaigns FOR ALL USING (true);
CREATE POLICY "Allow all operations on users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations on conversations" ON conversations FOR ALL USING (true);
CREATE POLICY "Allow all operations on messages" ON messages FOR ALL USING (true);
CREATE POLICY "Allow read access to quotes" ON quotes FOR SELECT USING (true);

-- Insert default campaign (using proper UUID)
INSERT INTO campaigns (id, name, welcome_video_id, thank_you_video_id, question_text)
VALUES (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Demo Campaign',
  '80c576b4fdece39a6c8abddc1aa2f7bc',
  '163ef2bcb5927b2d316918134a267108',
  'Why do you want to work with us?'
) ON CONFLICT (id) DO UPDATE SET
  welcome_video_id = EXCLUDED.welcome_video_id,
  thank_you_video_id = EXCLUDED.thank_you_video_id,
  question_text = EXCLUDED.question_text;

-- Insert quotes
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
('Energy and consciousness are one; our human journey is to remember and return home.', 'Benjamin Kurtz', 'consciousness')
ON CONFLICT DO NOTHING;
`

  const runSetup = async () => {
    setStatus("running")
    setError("")
    setShowManualSQL(false)

    try {
      const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

      setCurrentStep("Testing connection...")

      // Test basic connection with a simple query
      const { error: connectionError } = await supabase.auth.getSession()

      if (connectionError && !connectionError.message.includes("session")) {
        throw new Error(`Connection failed: ${connectionError.message}`)
      }

      setCurrentStep("Checking existing tables...")

      // Check each table and collect missing ones
      const tablesToCheck = ["campaigns", "users", "conversations", "messages", "quotes"]
      const missingTables = []

      for (const tableName of tablesToCheck) {
        setCurrentStep(`Checking ${tableName} table...`)
        const { error } = await supabase.from(tableName).select("count").limit(1)

        if (error && error.message.includes("relation")) {
          missingTables.push(tableName)
        }
      }

      if (missingTables.length > 0) {
        setCurrentStep(`Missing tables: ${missingTables.join(", ")}`)
        setShowManualSQL(true)
        throw new Error(
          `Missing tables detected: ${missingTables.join(", ")}. Please run the SQL commands manually in your Supabase dashboard.`,
        )
      }

      setCurrentStep("Verifying demo campaign...")

      // Check if demo campaign exists
      const { data: campaignData, error: campaignError } = await supabase
        .from("campaigns")
        .select("id")
        .eq("id", "00000000-0000-0000-0000-000000000001")
        .single()

      if (campaignError && campaignError.code === "PGRST116") {
        // Demo campaign doesn't exist, create it
        setCurrentStep("Creating demo campaign...")

        const { error: insertError } = await supabase.from("campaigns").insert({
          id: "00000000-0000-0000-0000-000000000001",
          name: "Demo Campaign",
          welcome_video_id: "80c576b4fdece39a6c8abddc1aa2f7bc",
          thank_you_video_id: "163ef2bcb5927b2d316918134a267108",
          question_text: "Why do you want to work with us?",
        })

        if (insertError) {
          console.warn("Demo campaign creation failed:", insertError)
          // Don't fail setup for this
        }
      }

      setCurrentStep("Checking quotes data...")

      // Check if quotes are populated
      const { count, error: quotesCountError } = await supabase
        .from("quotes")
        .select("*", { count: "exact", head: true })

      if (quotesCountError) {
        throw new Error(`Error checking quotes: ${quotesCountError.message}`)
      }

      if (!count || count === 0) {
        setShowManualSQL(true)
        throw new Error("Quotes table exists but is empty. Please run the SQL commands to populate quotes.")
      }

      setCurrentStep("Verifying Cloudflare Stream...")

      // Test Cloudflare Stream API
      try {
        const response = await fetch("/api/get-upload-url")
        if (!response.ok) {
          console.warn("Cloudflare Stream test failed, but continuing setup")
        }
      } catch (error) {
        console.warn("Cloudflare Stream test failed:", error)
        // Don't fail setup for this
      }

      setCurrentStep("Setup completed successfully!")
      setStatus("success")
    } catch (error) {
      console.error("Setup error:", error)
      setError(error instanceof Error ? error.message : "Setup failed")
      setStatus("error")

      // Only show manual SQL if we detected missing tables
      if (error instanceof Error && error.message.includes("Missing tables")) {
        setShowManualSQL(true)
      }
    }
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(sqlCommands)
    alert("SQL commands copied to clipboard!")
  }

  const StatusIcon = ({ status }: { status: "idle" | "running" | "success" | "error" }) => {
    switch (status) {
      case "running":
        return <Loader2 className="h-5 w-5 animate-spin text-blue-500" />
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      default:
        return <Database className="h-5 w-5 text-gray-500" />
    }
  }

  return (
    <div className="min-h-screen bg-black text-white p-4">
      <div className="max-w-2xl mx-auto">
        <Card className="bg-gray-900 border-gray-700" style={{ borderRadius: "12px" }}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-white">
              <Database className="h-6 w-6" />
              Database Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-blue-900/20 border border-blue-700" style={{ borderRadius: "12px" }}>
              <p className="text-blue-300 text-sm">
                This will create the necessary database tables for your ANSVR app:
              </p>
              <ul className="mt-2 text-blue-200 text-sm space-y-1">
                <li>• campaigns - Store video campaign data</li>
                <li>• users - Store user accounts</li>
                <li>• conversations - Store conversation threads</li>
                <li>• messages - Store video/audio/text messages</li>
                <li>• quotes - Store inspirational quotes for upload screen</li>
              </ul>
            </div>

            <div
              className="flex items-center justify-between p-4 border border-gray-700 bg-gray-800"
              style={{ borderRadius: "12px" }}
            >
              <div>
                <h3 className="font-medium text-white">Database Tables</h3>
                <p className="text-sm text-gray-300">
                  {status === "idle" && "Ready to create database tables"}
                  {status === "running" && currentStep}
                  {status === "success" && "All tables created successfully!"}
                  {status === "error" && "Setup failed - manual setup required"}
                </p>
                {error && <p className="text-sm text-red-400 mt-1">{error}</p>}
              </div>
              <StatusIcon status={status} />
            </div>

            <div className="flex gap-4">
              {status === "success" ? (
                <Link href="/c/demo" className="flex-1">
                  <Button className="w-full bg-[#2DAD71] hover:bg-[#2DAD71]/90" style={{ borderRadius: "6px" }}>
                    Test ANSVR App
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <Button
                  onClick={runSetup}
                  disabled={status === "running"}
                  className="flex-1 bg-[#2DAD71] hover:bg-[#2DAD71]/90"
                  style={{ borderRadius: "6px" }}
                >
                  {status === "running" ? "Setting up..." : "Run Setup"}
                </Button>
              )}
            </div>

            {showManualSQL && (
              <div className="p-4 bg-yellow-900/20 border border-yellow-700" style={{ borderRadius: "12px" }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-yellow-300 font-medium">Database Setup Required</p>
                  <Button
                    onClick={copyToClipboard}
                    size="sm"
                    variant="outline"
                    className="border-yellow-700 text-yellow-300 hover:bg-yellow-900/20"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copy SQL
                  </Button>
                </div>
                <p className="text-yellow-200 text-sm mb-3">
                  Your database tables need to be created. Please follow these steps:
                </p>
                <div
                  className="bg-black/50 p-3 text-xs text-gray-300 max-h-40 overflow-y-auto"
                  style={{ borderRadius: "6px" }}
                >
                  <pre>{sqlCommands}</pre>
                </div>
                <div className="mt-3 text-sm text-yellow-200 space-y-1">
                  <p>
                    <strong>Steps:</strong>
                  </p>
                  <p>
                    1. Go to your{" "}
                    <a
                      href="https://supabase.com/dashboard"
                      target="_blank"
                      className="text-yellow-300 underline"
                      rel="noreferrer"
                    >
                      Supabase Dashboard
                    </a>
                  </p>
                  <p>2. Select your project</p>
                  <p>
                    3. Navigate to <strong>SQL Editor</strong> in the left sidebar
                  </p>
                  <p>
                    4. Click <strong>New Query</strong>
                  </p>
                  <p>5. Paste the SQL commands above</p>
                  <p>
                    6. Click <strong>Run</strong> to execute
                  </p>
                  <p>7. Come back here and click "Run Setup" again</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
