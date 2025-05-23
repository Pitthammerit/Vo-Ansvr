export interface VideoResponse {
  id: string
  question_id: string
  type: "video" | "audio" | "text"
  content: string
  created_at: string
}

export interface VideoQuestion {
  id: string
  conversation_id: string
  video_url: string
  text: string
  created_at: string
  responses?: VideoResponse[]
}

export interface VideoConversation {
  id: string
  title: string
  thumbnail: string
  created_at: string
  questions?: VideoQuestion[]
}

// Database types for Supabase
export interface Database {
  public: {
    Tables: {
      conversations: {
        Row: {
          id: string
          title: string
          thumbnail: string
          created_at: string
        }
        Insert: {
          title: string
          thumbnail: string
        }
        Update: {
          title?: string
          thumbnail?: string
        }
      }
      questions: {
        Row: {
          id: string
          conversation_id: string
          video_url: string
          text: string
          created_at: string
        }
        Insert: {
          conversation_id: string
          video_url: string
          text: string
        }
        Update: {
          video_url?: string
          text?: string
        }
      }
      responses: {
        Row: {
          id: string
          question_id: string
          type: "video" | "audio" | "text"
          content: string
          created_at: string
        }
        Insert: {
          question_id: string
          type: "video" | "audio" | "text"
          content: string
        }
        Update: {
          type?: "video" | "audio" | "text"
          content?: string
        }
      }
    }
  }
}
