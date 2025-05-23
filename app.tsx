"use client"

import { useState } from "react"
import { NavigationContainer } from "@react-navigation/native"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import HomeScreen from "./screens/home-screen"
import RecordScreen from "./screens/record-screen"
import ConversationScreen from "./screens/conversation-screen"
import type { VideoConversation } from "./types"
import { createClient } from "@supabase/supabase-js"
import { useEffect } from "react"
import { View, Text } from "react-native"

export type RootStackParamList = {
  Home: undefined
  Record: { conversationId?: string }
  Conversation: { conversationId: string }
}

const Stack = createNativeStackNavigator<RootStackParamList>()

// Initialize Supabase client
const supabaseUrl = "YOUR_SUPABASE_URL"
const supabaseAnonKey = "YOUR_SUPABASE_ANON_KEY"

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export default function App() {
  const [conversations, setConversations] = useState<VideoConversation[]>([])
  const [loading, setLoading] = useState(true)

  // Load conversations from Supabase on app start
  useEffect(() => {
    loadConversations()
  }, [])

  const loadConversations = async () => {
    try {
      const { data, error } = await supabase
        .from("conversations")
        .select(`
          *,
          questions (
            *,
            responses (*)
          )
        `)
        .order("created_at", { ascending: false })

      if (error) throw error

      setConversations(data || [])
    } catch (error) {
      console.error("Error loading conversations:", error)
    } finally {
      setLoading(false)
    }
  }

  const addConversation = async (conversation: Omit<VideoConversation, "id" | "createdAt">) => {
    try {
      // Insert conversation
      const { data: conversationData, error: conversationError } = await supabase
        .from("conversations")
        .insert({
          title: conversation.title,
          thumbnail: conversation.thumbnail,
        })
        .select()
        .single()

      if (conversationError) throw conversationError

      // Insert questions
      const questionsToInsert = conversation.questions.map((q) => ({
        conversation_id: conversationData.id,
        video_url: q.videoUrl,
        text: q.text,
      }))

      const { error: questionsError } = await supabase.from("questions").insert(questionsToInsert)

      if (questionsError) throw questionsError

      // Reload conversations
      loadConversations()

      return conversationData.id
    } catch (error) {
      console.error("Error adding conversation:", error)
      throw error
    }
  }

  const addResponse = async (
    conversationId: string,
    questionId: string,
    response: {
      type: "video" | "audio" | "text"
      content: string
    },
  ) => {
    try {
      const { error } = await supabase.from("responses").insert({
        question_id: questionId,
        type: response.type,
        content: response.content,
      })

      if (error) throw error

      // Reload conversations to get updated data
      loadConversations()
    } catch (error) {
      console.error("Error adding response:", error)
      throw error
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <Text>Loading...</Text>
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" options={{ title: "VideoAsk Clone" }}>
          {(props) => <HomeScreen {...props} conversations={conversations} />}
        </Stack.Screen>
        <Stack.Screen name="Record" options={{ title: "Record Video" }}>
          {(props) => <RecordScreen {...props} addConversation={addConversation} addResponse={addResponse} />}
        </Stack.Screen>
        <Stack.Screen name="Conversation" options={{ title: "Conversation" }}>
          {(props) => <ConversationScreen {...props} conversations={conversations} addResponse={addResponse} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  )
}
