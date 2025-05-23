import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image } from "react-native"
import type { NativeStackScreenProps } from "@react-navigation/native-stack"
import type { RootStackParamList } from "../app"
import type { VideoConversation, VideoQuestion } from "../types"
import { Video, Mic, FileText, Plus } from "lucide-react-native"

type Props = NativeStackScreenProps<RootStackParamList, "Conversation"> & {
  conversations: VideoConversation[]
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

export default function ConversationScreen({ route, navigation, conversations, addResponse }: Props) {
  const { conversationId } = route.params
  const conversation = conversations.find((c) => c.id === conversationId)

  if (!conversation) {
    return (
      <View style={styles.container}>
        <Text>Conversation not found</Text>
      </View>
    )
  }

  const renderResponseIcon = (type: "video" | "audio" | "text") => {
    switch (type) {
      case "video":
        return <Video size={16} color="#666" />
      case "audio":
        return <Mic size={16} color="#666" />
      case "text":
        return <FileText size={16} color="#666" />
    }
  }

  // Update the component to handle the new data structure:
  const renderQuestion = ({ item }: { item: VideoQuestion }) => {
    return (
      <View style={styles.questionContainer}>
        <View style={styles.questionCard}>
          <Image
            source={{ uri: item.video_url || "https://example.com/thumbnail1.jpg" }}
            style={styles.questionThumbnail}
          />
          <View style={styles.playButton}>
            <Video size={24} color="#fff" />
          </View>
          <Text style={styles.questionText}>{item.text}</Text>
        </View>

        <Text style={styles.responsesTitle}>Responses ({item.responses?.length || 0})</Text>

        {item.responses && item.responses.length > 0 ? (
          <FlatList
            data={item.responses}
            keyExtractor={(response) => response.id}
            renderItem={({ item: response }) => (
              <View style={styles.responseCard}>
                <View style={styles.responseIconContainer}>{renderResponseIcon(response.type)}</View>
                <View style={styles.responseContent}>
                  <Text style={styles.responseText}>
                    {response.type === "text" ? response.content : `${response.type} response`}
                  </Text>
                  <Text style={styles.responseDate}>{new Date(response.created_at).toLocaleDateString()}</Text>
                </View>
              </View>
            )}
          />
        ) : (
          <View style={styles.emptyResponses}>
            <Text style={styles.emptyResponsesText}>No responses yet</Text>
          </View>
        )}

        <TouchableOpacity
          style={styles.addResponseButton}
          onPress={() => navigation.navigate("Record", { conversationId, questionId: item.id })}
        >
          <Plus size={16} color="#fff" />
          <Text style={styles.addResponseText}>Add Response</Text>
        </TouchableOpacity>
      </View>
    )
  }

  // Update the main render to use the new data structure:
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{conversation.title}</Text>
        <Text style={styles.date}>Created on {new Date(conversation.created_at).toLocaleDateString()}</Text>
      </View>

      <FlatList data={conversation.questions || []} keyExtractor={(item) => item.id} renderItem={renderQuestion} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    padding: 16,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 4,
  },
  date: {
    fontSize: 14,
    color: "#666",
  },
  questionContainer: {
    padding: 16,
  },
  questionCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  questionThumbnail: {
    width: "100%",
    height: 200,
  },
  playButton: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -24,
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  questionText: {
    padding: 16,
    fontSize: 16,
  },
  responsesTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 16,
    marginBottom: 8,
  },
  responseCard: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
  },
  responseIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  responseContent: {
    flex: 1,
  },
  responseText: {
    fontSize: 14,
  },
  responseDate: {
    fontSize: 12,
    color: "#666",
    marginTop: 4,
  },
  emptyResponses: {
    padding: 16,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 8,
    marginBottom: 16,
  },
  emptyResponsesText: {
    color: "#666",
  },
  addResponseButton: {
    backgroundColor: "#ff6b6b",
    borderRadius: 8,
    padding: 12,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  addResponseText: {
    color: "#fff",
    fontWeight: "bold",
    marginLeft: 8,
  },
})
