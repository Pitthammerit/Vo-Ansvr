export interface VideoConversation {
  id: string
  title: string
  thumbnail: string | null
  created_at: string
  questions?: VideoQuestion[]
}

export interface VideoQuestion {
  id: string
  conversation_id: string
  text: string
  video_url: string | null
  created_at: string
  responses?: VideoResponse[]
}

export interface VideoResponse {
  id: string
  question_id: string
  type: "video" | "audio" | "text"
  content: string
  created_at: string
}
