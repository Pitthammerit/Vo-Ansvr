import { createClient } from "@supabase/supabase-js"

export interface Quote {
  id: string
  text: string
  author: string
  category?: string
}

export interface QuoteConfig {
  tableName: string
  columns: {
    text: string
    author: string
    category: string
  }
  category?: string
  limit?: number
}

export class QuoteService {
  private supabase
  private config: QuoteConfig
  private quotes: Quote[] = []
  private currentQuoteIndex = 0
  private uploadQuoteTimer: NodeJS.Timeout | null = null
  private uploadInProgress = false
  private initialized = false
  private usingFallback = false

  // Fallback quotes if Supabase fails
  private fallbackQuotes: Quote[] = [
    {
      id: "fallback-1",
      text: "When stillness descends, the observer awakens, and you return to your true self.",
      author: "Benjamin Kurtz",
    },
    {
      id: "fallback-2",
      text: "The quieter you become, the more you can hear.",
      author: "Ram Dass",
    },
    {
      id: "fallback-3",
      text: "Consciousness is the field of all possibilities.",
      author: "Deepak Chopra",
    },
    {
      id: "fallback-4",
      text: "Peace comes from within. Do not seek it without.",
      author: "Buddha",
    },
    {
      id: "fallback-5",
      text: "Energy and consciousness are one; our human journey is to remember and return home.",
      author: "Benjamin Kurtz",
    },
    {
      id: "fallback-6",
      text: "Surrender is the ultimate strength, not weakness.",
      author: "Michael Singer",
    },
    {
      id: "fallback-7",
      text: "Your mind is a powerful thing. When you fill it with positive thoughts, your life will start to change.",
      author: "Napoleon Hill",
    },
    {
      id: "fallback-8",
      text: "Meditation is not about stopping thoughts, but recognizing that you are more than your thoughts.",
      author: "Deepak Chopra",
    },
    {
      id: "fallback-9",
      text: "Silence is the language of God, all else is poor translation.",
      author: "Rumi",
    },
    {
      id: "fallback-10",
      text: "Your inner peace is the greatest weapon against life's challenges.",
      author: "Thich Nhat Hanh",
    },
  ]

  constructor(config: Partial<QuoteConfig> = {}) {
    let useFallback = false
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

      console.log("🔧 QuoteService: Initializing...")
      console.log("🔧 Supabase URL:", supabaseUrl ? "✅ Present" : "❌ Missing")
      console.log("🔧 Supabase Key:", supabaseAnonKey ? "✅ Present" : "❌ Missing")

      if (!supabaseUrl || !supabaseAnonKey) {
        console.warn("⚠️ Supabase environment variables not configured, using fallback quotes")
        useFallback = true
      } else {
        this.supabase = createClient(supabaseUrl, supabaseAnonKey)
        console.log("✅ Supabase client created successfully")
      }

      // Default configuration
      this.config = {
        tableName: "quotes",
        columns: {
          text: "quote_text",
          author: "quote_author",
          category: "quote_category",
        },
        category: "consciousness",
        limit: 15,
        ...config,
      }
    } catch (error) {
      console.warn("❌ Failed to initialize Supabase client, using fallback quotes:", error)
      useFallback = true
    }

    if (useFallback) {
      this.useFallbackQuotes()
    }
  }

  private useFallbackQuotes(): void {
    console.log("📝 Using fallback quotes")
    this.quotes = this.shuffleArray([...this.fallbackQuotes])
    this.initialized = true
    this.usingFallback = true
  }

  async fetchQuotes(): Promise<Quote[]> {
    if (this.initialized) {
      console.log("📝 Quotes already initialized, returning cached quotes")
      return this.quotes
    }

    console.log("🔄 Fetching quotes from database...")

    try {
      if (!this.supabase) {
        console.log("❌ No Supabase client, using fallback")
        this.useFallbackQuotes()
        return this.quotes
      }

      // Test connection first
      console.log("🔍 Testing Supabase connection...")
      const { data: testData, error: testError } = await this.supabase
        .from(this.config.tableName)
        .select("count")
        .limit(1)

      if (testError) {
        console.warn("❌ Connection test failed:", testError.message)

        // Check if it's a table not found error
        if (testError.message.includes("relation") && testError.message.includes("does not exist")) {
          console.warn("📋 Quotes table does not exist, using fallback quotes. Please run database setup.")
        } else {
          console.warn("🔌 Database connection issue, using fallback quotes")
        }

        this.useFallbackQuotes()
        return this.quotes
      }

      console.log("✅ Connection test successful")

      // Now fetch the actual quotes
      let query = this.supabase
        .from(this.config.tableName)
        .select(
          `
          id,
          ${this.config.columns.text},
          ${this.config.columns.author},
          ${this.config.columns.category}
        `,
        )
        .limit(this.config.limit || 15)

      // Optional category filtering
      if (this.config.category) {
        query = query.eq(this.config.columns.category, this.config.category)
      }

      console.log("📊 Executing quotes query...")
      const { data, error } = await query

      if (error) {
        console.warn("❌ Quote query failed:", error.message)
        this.useFallbackQuotes()
        return this.quotes
      }

      if (!data || data.length === 0) {
        console.warn("📭 No quotes found in database, using fallback quotes")
        this.useFallbackQuotes()
        return this.quotes
      }

      console.log(`✅ Successfully loaded ${data.length} quotes from database`)

      this.quotes = data.map((quote) => ({
        id: quote.id,
        text: quote[this.config.columns.text],
        author: quote[this.config.columns.author],
        category: quote[this.config.columns.category],
      }))

      // Shuffle quotes for variety
      this.quotes = this.shuffleArray(this.quotes)
      this.initialized = true
      this.usingFallback = false

      console.log("🎲 Quotes shuffled and ready")
      return this.quotes
    } catch (error) {
      console.warn("💥 Unexpected error fetching quotes:", error)
      this.useFallbackQuotes()
      return this.quotes
    }
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
  }

  getCurrentQuote(): Quote | null {
    if (this.quotes.length === 0) {
      console.log("📝 No quotes available, using fallback")
      this.useFallbackQuotes()
    }
    const current = this.quotes[this.currentQuoteIndex] || null
    console.log("📖 Current quote:", current?.text?.substring(0, 50) + "...")
    return current
  }

  getNextQuote(): Quote | null {
    if (this.quotes.length === 0) {
      this.useFallbackQuotes()
    }

    if (this.quotes.length <= 1) return this.getCurrentQuote()

    // Ensure next quote is different
    let nextIndex
    do {
      nextIndex = Math.floor(Math.random() * this.quotes.length)
    } while (nextIndex === this.currentQuoteIndex && this.quotes.length > 1)

    this.currentQuoteIndex = nextIndex
    const next = this.quotes[this.currentQuoteIndex]
    console.log("➡️ Next quote:", next?.text?.substring(0, 50) + "...")
    return next
  }

  startUploadQuoteRotation(onQuoteChange?: (quote: Quote) => void): void {
    console.log("🔄 Starting upload quote rotation...")
    this.uploadInProgress = true

    // Rotate quote every 15 seconds during upload
    this.uploadQuoteTimer = setInterval(() => {
      if (this.uploadInProgress) {
        const nextQuote = this.getNextQuote()
        if (nextQuote && onQuoteChange) {
          console.log("🔄 Quote rotation triggered")
          onQuoteChange(nextQuote)
        }
      }
    }, 15000) // 15 seconds
  }

  stopUploadQuoteRotation(): void {
    console.log("⏹️ Stopping upload quote rotation")
    this.uploadInProgress = false
    if (this.uploadQuoteTimer) {
      clearInterval(this.uploadQuoteTimer)
      this.uploadQuoteTimer = null
    }
  }

  // Method to insert new quotes (only works if Supabase is available)
  async insertQuote(quoteText: string, quoteAuthor: string, category = "consciousness"): Promise<Quote | null> {
    try {
      if (!this.supabase) {
        console.warn("Cannot insert quote: Supabase not available")
        return null
      }

      const { data, error } = await this.supabase
        .from(this.config.tableName)
        .insert([
          {
            [this.config.columns.text]: quoteText,
            [this.config.columns.author]: quoteAuthor,
            [this.config.columns.category]: category,
          },
        ])
        .select()
        .single()

      if (error) throw error

      const newQuote: Quote = {
        id: data.id,
        text: data[this.config.columns.text],
        author: data[this.config.columns.author],
        category: data[this.config.columns.category],
      }

      // Add to local quotes array
      this.quotes.push(newQuote)

      return newQuote
    } catch (error) {
      console.error("Error inserting quote:", error)
      return null
    }
  }

  // Check if database is available
  async isDatabaseAvailable(): Promise<boolean> {
    try {
      if (!this.supabase) {
        console.log("🔌 No Supabase client available")
        return false
      }

      console.log("🔍 Testing database availability...")
      const { error } = await this.supabase.from(this.config.tableName).select("count").limit(1)

      if (error) {
        console.log("❌ Database test failed:", error.message)
        return false
      }

      console.log("✅ Database is available")
      return true
    } catch (error) {
      console.log("💥 Database availability check failed:", error)
      return false
    }
  }

  // Get debug info
  getDebugInfo() {
    return {
      initialized: this.initialized,
      usingFallback: this.usingFallback,
      quotesCount: this.quotes.length,
      currentIndex: this.currentQuoteIndex,
      uploadInProgress: this.uploadInProgress,
      hasSupabaseClient: !!this.supabase,
    }
  }

  // Cleanup method
  cleanup(): void {
    console.log("🧹 Cleaning up QuoteService")
    this.stopUploadQuoteRotation()
  }
}

// Export a default instance
export const quoteService = new QuoteService()
