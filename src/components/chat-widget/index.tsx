import { useState, useEffect } from "react";
import { ChatbotProvider, useChatbot, RagProvider } from "@aptos-labs/ai-chatbot-client";
import { ChatDialog } from "./chat-dialog";

function ChatDialogContainer() {
  const {
    messages = [],
    sendMessage,
    isLoading = false,
    isGenerating = false,
    isTyping = false,
    hasMoreMessages = false,
    fastMode = false,
    chats = [],
    currentChatId,
    stopGenerating,
    loadPreviousMessages,
    copyMessage,
    provideFeedback,
    createNewChat,
    selectChat,
    deleteChat,
    updateChatTitle,
    setFastMode,
    updateConfig,
  } = useChatbot();

  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Listen for toggle events
  useEffect(() => {
    const handleToggle = () => {
      setIsOpen((prev) => !prev);
    };
    window.addEventListener("toggle-chat", handleToggle);
    return () => {
      window.removeEventListener("toggle-chat", handleToggle);
    };
  }, []);

  const handleSendMessage = async (message: string) => {
    try {
      await sendMessage(message);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to send message. Please try again.";
      setError(errorMessage);
    }
  };

  return (
    <>
      <ChatDialog
        open={isOpen}
        onOpenChange={setIsOpen}
        messages={messages}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        isGenerating={isGenerating}
        isTyping={isTyping}
        hasMoreMessages={hasMoreMessages}
        fastMode={fastMode}
        showSidebar={true}
        onStopGenerating={stopGenerating}
        onLoadMore={loadPreviousMessages}
        onCopyMessage={copyMessage}
        onMessageFeedback={provideFeedback}
        onNewChat={createNewChat}
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={(chatId: string) => {
          selectChat(chatId);
        }}
        onDeleteChat={(chatId: string) => deleteChat(chatId)}
        onUpdateChatTitle={updateChatTitle}
        onToggleFastMode={(enabled) => {
          setFastMode(enabled);
          updateConfig({ fastMode: enabled });
        }}
      />
      {error && (
        <div className="fixed bottom-4 right-4 rounded-lg bg-red-500 px-4 py-2 text-white">
          {error}
        </div>
      )}
    </>
  );
}

interface ChatWidgetProps {
  apiKey: string;
  apiUrl: string;
}

export function ChatWidget({ apiKey, apiUrl }: ChatWidgetProps) {
  return (
    <ChatbotProvider
      config={{
        apiKey,
        apiUrl,
        ragProvider: RagProvider.DEVELOPER_DOCS,
      }}
    >
      <ChatDialogContainer />
    </ChatbotProvider>
  );
}
