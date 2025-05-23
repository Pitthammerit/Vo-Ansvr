"use client"

import { useState, useEffect } from "react"
import { supabase } from "../app"
import type { VideoConversation } from "../types"

export function useConversations() {
  const [conversations, setConversations] = useState<VideoConversation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadConversations = async () => {
    try {
      setLoading(true)
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
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred")
      console.error("Error loading conversations:", err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadConversations()

    // Subscribe to real-time changes
    const subscription = supabase
      .channel("conversations_changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "conversations" }, () => loadConversations())
      .on("postgres_changes", { event: "*", schema: "public", table: "questions" }, () => loadConversations())
      .on("postgres_changes", { event: "*", schema: "public", table: "responses" }, () => loadConversations())
      .subscribe()

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  return { conversations, loading, error, refetch: loadConversations }
}

export function useSupabaseStorage() {
  const uploadFile = async (file: Blob | File, fileName: string, bucket = "media"): Promise<string> => {
    try {
      const { data, error } = await supabase.storage.from(bucket).upload(fileName, file)

      if (error) throw error

      const {
        data: { publicUrl },
      } = supabase.storage.from(bucket).getPublicUrl(fileName)

      return publicUrl
    } catch (error) {
      console.error("Error uploading file:", error)
      throw error
    }
  }

  const deleteFile = async (fileName: string, bucket = "media") => {
    try {
      const { error } = await supabase.storage.from(bucket).remove([fileName])

      if (error) throw error
    } catch (error) {
      console.error("Error deleting file:", error)
      throw error
    }
  }

  return { uploadFile, deleteFile }
}
