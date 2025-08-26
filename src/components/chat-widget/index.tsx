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
    isSharedChatMode,
    sharedChatId,
    error: chatbotError,
  } = useChatbot();

  const [isOpen, setIsOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = useState(false);

  // Handle chatbot errors and successful requests
  useEffect(() => {
    if (chatbotError) {
      if (chatbotError.message === "RATE_LIMIT_EXCEEDED") {
        setError("Rate limit exceeded. Please try again later.");
        setIsRateLimited(true);
      } else {
        setError(chatbotError.message);
      }
    } else if (messages.length > 0) {
      // If we successfully got messages, we're not rate limited anymore
      setIsRateLimited(false);
    }
  }, [chatbotError, messages]);

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

  const handleError = (err: unknown, defaultMessage: string) => {
    let errorMessage = defaultMessage;
    if (err instanceof Error) {
      if (err.message === "RATE_LIMIT_EXCEEDED") {
        errorMessage = "You've reached the rate limit. Please wait a moment before trying again.";
      } else {
        errorMessage = err.message;
      }
    }
    setError(errorMessage);
  };

  const handleSendMessage = async (message: string) => {
    try {
      await sendMessage(message);
    } catch (err: unknown) {
      handleError(err, "Failed to send message. Please try again.");
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
        error={error}
        onDismissError={() => {
          setError(null);
          // Keep isRateLimited true until we successfully make a new request
        }}
        isRateLimited={isRateLimited}
        isSharedChatMode={isSharedChatMode}
        sharedChatId={sharedChatId}
      />
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
