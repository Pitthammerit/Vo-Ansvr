"use client"

import { useState, useRef, useEffect } from "react"
import { View, Text, TouchableOpacity, StyleSheet, TextInput, Alert } from "react-native"
import { Camera } from "expo-camera"
import { Audio } from "expo-av"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../app"
import type { VideoConversation } from "../types"
import { Mic, Video, X, Send } from "lucide-react-native"
import { supabase } from "../app"
import * as FileSystem from "expo-file-system"

// Add this function at the top of the component, before the main component function:
const uploadFile = async (uri: string, fileName: string, fileType: "video" | "audio"): Promise<string> => {
  try {
    const fileExt = fileType === "video" ? "mp4" : "mp3"
    const filePath = `${fileType}s/${fileName}.${fileExt}`

    // Read file as base64
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    })

    // Convert base64 to blob
    const response = await fetch(`data:${fileType}/${fileExt};base64,${base64}`)
    const blob = await response.blob()

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage.from("media").upload(filePath, blob)

    if (error) throw error

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from("media").getPublicUrl(filePath)

    return publicUrl
  } catch (error) {
    console.error("Error uploading file:", error)
    throw error
  }
}
// ─── Fetch direct-upload URL + UID ────────────────────────────────────────
async function getUploadUrl() {
  const res = await fetch(
    'https://yxskpbwikpoyagexkbro.supabase.co/functions/v1/get-upload-url'
  );
  if (!res.ok) throw new Error('Failed to fetch upload URL');
  return await res.json(); // { uploadURL, uid }
}
// ──────────────────────────────────────────────────────────────────────────

type Props = NativeStackScreenProps<RootStackParamList, "Record"> & {
  addConversation: (conversation: VideoConversation) => void
  addResponse: (
    conversationId: string,
    questionId: string,
    response: {
      type: "video" | "audio" | "text"
      content: string
      createdAt: string
    },
  ) => void
}

export default function RecordScreen({ navigation, route, addConversation, addResponse }: Props) {
  const [hasPermission, setHasPermission] = useState<boolean | null>(null)
  const [type, setType] = useState<"video" | "audio" | "text">("video")
  const [recording, setRecording] = useState(false)
  const [textResponse, setTextResponse] = useState("")
  const [title, setTitle] = useState("")
  const cameraRef = useRef<Camera>(null)
  const conversationId = route.params?.conversationId
  const isNewConversation = !conversationId

  useEffect(() => {
    ;(async () => {
      const { status: cameraStatus } = await Camera.requestCameraPermissionsAsync()
      const { status: audioStatus } = await Audio.requestPermissionsAsync()
      setHasPermission(cameraStatus === "granted" && audioStatus === "granted")
    })()
  }, [])

  const startRecording = async () => {
    if (cameraRef.current) {
      setRecording(true)
      // In a real app, you would actually record video here
      // const video = await cameraRef.current.recordAsync();
      console.log("Started recording")
    }
  }

  const stopRecording = async () => {
    if (cameraRef.current) {
      setRecording(false)
      // In a real app, you would stop recording here
      // cameraRef.current.stopRecording();
      console.log("Stopped recording")
    }
  }

// ─── Updated handleSubmit ─────────────────────────────────────────────────
const handleSubmit = async () => {
  try {
    if (type === 'text') {
      // Save text response
      await supabase.from('responses').insert({
        ask_id: 'default',
        type: 'text',
        media_uid: textResponse,        // for text, store the text in media_uid
      });
    } else {
      // 1. Get upload URL + UID
      const { uploadURL, uid } = await getUploadUrl();

      // 2. Fetch the recorded file blob
      //    Replace `recordedFileUri` with your actual URI from recording state
      const blob = await fetch(recordedFileUri).then(res => res.blob());

      // 3. Upload to Cloudflare
      await fetch(uploadURL, {
        method: 'PUT',
        headers: { 'Content-Type': blob.type },
        body: blob,
      });

      // 4. Store the Cloudflare UID
      await supabase.from('responses').insert({
        ask_id: 'default',
        type,
        media_uid: uid,
      });
    }

    // Navigate to a thank-you screen
    navigation.navigate('ThankYou');
  } catch (error: any) {
    Alert.alert('Error', error.message || 'Upload failed');
    console.error('handleSubmit error:', error);
  }
};
// ─────────────────────────────────────────────────────────────────────────────

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text>Requesting permissions...</Text>
      </View>
    )
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text>No access to camera or microphone</Text>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      {isNewConversation && (
        <TextInput
          style={styles.titleInput}
          placeholder="Enter conversation title"
          value={title}
          onChangeText={setTitle}
        />
      )}

      <View style={styles.typeSelector}>
        <TouchableOpacity
          style={[styles.typeButton, type === "video" && styles.selectedType]}
          onPress={() => setType("video")}
        >
          <Video size={20} color={type === "video" ? "#fff" : "#000"} />
          <Text style={[styles.typeText, type === "video" && styles.selectedTypeText]}>Video</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeButton, type === "audio" && styles.selectedType]}
          onPress={() => setType("audio")}
        >
          <Mic size={20} color={type === "audio" ? "#fff" : "#000"} />
          <Text style={[styles.typeText, type === "audio" && styles.selectedTypeText]}>Audio</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.typeButton, type === "text" && styles.selectedType]}
          onPress={() => setType("text")}
        >
          <Text style={[styles.typeText, type === "text" && styles.selectedTypeText]}>Text</Text>
        </TouchableOpacity>
      </View>

      {type === "text" ? (
        <View style={styles.textContainer}>
          <TextInput
            style={styles.textInput}
            placeholder="Type your response here..."
            multiline
            value={textResponse}
            onChangeText={setTextResponse}
          />
        </View>
      ) : (
        <Camera style={styles.camera} type={Camera.Constants.Type.front} ref={cameraRef}>
          <View style={styles.cameraControls}>
            {recording ? (
              <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
                <X size={24} color="#fff" />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity style={styles.recordButton} onPress={startRecording}>
                {type === "video" ? <Video size={24} color="#fff" /> : <Mic size={24} color="#fff" />}
              </TouchableOpacity>
            )}
          </View>
        </Camera>
      )}

      <View style={styles.footer}>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <X size={24} color="#ff6b6b" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Send size={24} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  titleInput: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 8,
    margin: 16,
    fontSize: 16,
  },
  typeSelector: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 16,
  },
  typeButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
    borderRadius: 20,
    paddingHorizontal: 16,
  },
  selectedType: {
    backgroundColor: "#ff6b6b",
  },
  typeText: {
    marginLeft: 4,
  },
  selectedTypeText: {
    color: "#fff",
  },
  camera: {
    flex: 1,
    borderRadius: 8,
    margin: 16,
    overflow: "hidden",
  },
  cameraControls: {
    flex: 1,
    backgroundColor: "transparent",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingBottom: 20,
  },
  recordButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ff6b6b",
    justifyContent: "center",
    alignItems: "center",
  },
  stopButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "#ff6b6b",
    justifyContent: "center",
    alignItems: "center",
  },
  textContainer: {
    flex: 1,
    margin: 16,
  },
  textInput: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 8,
    fontSize: 16,
    textAlignVertical: "top",
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
  },
  cancelButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  submitButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#ff6b6b",
    justifyContent: "center",
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
})
