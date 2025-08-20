import * as Dialog from "@radix-ui/react-dialog";
import * as ScrollArea from "@radix-ui/react-scroll-area";
import { ChevronRight, ChevronLeft, Pencil, Trash2, X, Share2 } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useChatbot } from "@aptos-labs/ai-chatbot-client";
import { ShareModal } from "./share-modal";
import type { Message, Chat, ChatWidgetProps } from "./types";
import { ChatSidebar } from "./chat-sidebar";
import { ChatMessage } from "./chat-message";
import { ChatInput } from "./chat-input";
import type { ChatInputRef } from "./chat-input";

export interface ChatDialogProps extends Omit<ChatWidgetProps, "chats"> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  showTrigger?: boolean;
  chats?: Chat[];
}

export function ChatDialog({
  open,
  onOpenChange,
  messages = [],
  isGenerating,
  isTyping,
  hasMoreMessages,
  onSendMessage,
  onStopGenerating,
  onLoadMore,
  onCopyMessage,
  onMessageFeedback,

  onNewChat,
  className,
  messageClassName,
  fastMode,
  showSidebar = true,
  chats = [],
  currentChatId,
  onSelectChat,
  onDeleteChat,
  onUpdateChatTitle,
  onToggleFastMode,
  error,
  onDismissError,
  isSharedChatMode,
}: ChatDialogProps & {
  error?: string | null;
  onDismissError?: () => void;
  isSharedChatMode?: boolean;
  sharedChatId?: string | null;
}) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const { shareChat } = useChatbot();

  const chatInputRef = useRef<ChatInputRef>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Convert message timestamps from string to number
  const convertedMessages = messages.map((msg: Message) => ({
    ...msg,
    timestamp: typeof msg.timestamp === "string" ? Date.parse(msg.timestamp) : msg.timestamp,
  }));

  const scrollToBottom = (smooth = true) => {
    if (viewportRef.current) {
      viewportRef.current.scrollTo({
        top: viewportRef.current.scrollHeight,
        behavior: smooth ? "smooth" : "instant",
      });
    }
  };

  // Only scroll to bottom when opening a new chat
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      scrollToBottom(true);
    }, 100);
    return () => {
      clearTimeout(timeoutId);
    };
  }, [open]);

  // Scroll to bottom when switching chats
  useEffect(() => {
    scrollToBottom(false);
  }, [currentChatId]);

  const handleNewChat = () => {
    onNewChat?.();
    setTimeout(() => {
      chatInputRef.current?.focus();
    }, 100);
  };

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <div className="chat-dialog-container">
          <Dialog.Overlay className="chat-dialog-overlay" />
          <Dialog.Content
            className={`chat-dialog-content ${className ?? ""}`}
            aria-describedby="dialog-description"
          >
            <div className="chat-dialog-header">
              <div className="chat-dialog-title">
                <Dialog.Title className="chat-dialog-title-text">
                  <img src="/favicon.svg" alt="Aptos AI" className="chat-dialog-logo" />
                  AskAptos
                </Dialog.Title>
                {showSidebar && (
                  <button
                    onClick={() => {
                      setIsSidebarCollapsed(!isSidebarCollapsed);
                    }}
                    className="chat-button hidden md:block"
                  >
                    {isSidebarCollapsed ? (
                      <ChevronRight className="h-4 w-4" />
                    ) : (
                      <ChevronLeft className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>
              <div className="chat-dialog-actions">
                <button onClick={handleNewChat} className="chat-new-button">
                  <div className="chat-button-content">
                    <Pencil className="chat-icon" />
                    <span className="chat-button-text">New chat</span>
                  </div>
                </button>
                {currentChatId && (
                  <>
                    {!isSharedChatMode && currentChatId && (
                      <>
                        <button
                          onClick={() => {
                            setIsShareModalOpen(true);
                          }}
                          className="chat-button"
                        >
                          <Share2 className="h-5 w-5" />
                        </button>
                        <ShareModal
                          open={isShareModalOpen}
                          onOpenChange={setIsShareModalOpen}
                          onShare={(options) => shareChat(currentChatId, options)}
                        />
                      </>
                    )}
                    <button onClick={() => onDeleteChat?.(currentChatId)} className="chat-button">
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </>
                )}
                <Dialog.Close className="chat-button">
                  <X className="h-5 w-5" />
                </Dialog.Close>
              </div>
            </div>

            <Dialog.Description id="dialog-description" className="sr-only">
              Chat interface for interacting with Aptos AI assistant. Use this dialog to ask
              questions and get responses from the AI.
            </Dialog.Description>

            <div className="chat-dialog-body">
              {showSidebar && (
                <div className="chat-sidebar-container">
                  <ChatSidebar
                    chats={chats}
                    currentChatId={currentChatId ?? undefined}
                    onSelectChat={onSelectChat}
                    onDeleteChat={onDeleteChat}
                    onUpdateChatTitle={onUpdateChatTitle}
                    onNewChat={onNewChat}
                    fastMode={fastMode}
                    onToggleFastMode={onToggleFastMode}
                    isCollapsed={isSidebarCollapsed}
                    className="chat-sidebar"
                  />
                </div>
              )}

              <div className="chat-main">
                <div className="chat-messages">
                  <ScrollArea.Root className="chat-scroll-root">
                    <ScrollArea.Viewport ref={viewportRef} className="chat-scroll-viewport">
                      <div className="flex flex-col gap-4 p-4">
                        {hasMoreMessages && (
                          <button onClick={onLoadMore} className="chat-load-more">
                            Load more messages
                          </button>
                        )}
                        {messages.length === 0 && (
                          <div className="chat-empty-state">
                            <div className="chat-empty-icon">
                              <img src="/favicon.svg" alt="Aptos AI" className="chat-empty-logo" />
                            </div>
                            <div className="chat-empty-content">
                              <h3 className="chat-empty-title">Ask me anything about Aptos!</h3>
                              <p className="chat-empty-text">
                                I'm here to help you with Move development, blockchain concepts,
                                tools, and more.
                              </p>
                              <div className="chat-empty-tip">
                                <p className="chat-tip-text">
                                  💡 Pro tip: Toggle "Fast mode" in the sidebar for quicker
                                  responses. Note that fast responses might be less detailed.
                                </p>
                              </div>
                            </div>
                          </div>
                        )}
                        {convertedMessages.map((message: Message) => (
                          <ChatMessage
                            key={message.id}
                            message={message}
                            onCopy={() => onCopyMessage?.(message.id)}
                            onFeedback={(messageId, feedback) =>
                              onMessageFeedback?.(messageId, feedback)
                            }
                            className={messageClassName}
                          />
                        ))}
                        {isGenerating && !isTyping && (
                          <div className="chat-message">
                            <div className="chat-message-content">
                              <div className="chat-message-text">
                                <div className="chat-thinking">
                                  <img
                                    src="/favicon.svg"
                                    alt="Aptos AI"
                                    className="chat-thinking-logo"
                                  />
                                  <span>AskAptos is thinking...</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </ScrollArea.Viewport>
                    <ScrollArea.Scrollbar
                      orientation="vertical"
                      className="flex w-2.5 touch-none select-none bg-transparent p-[2px]"
                    >
                      <ScrollArea.Thumb className="relative flex-1 rounded-full bg-[#2E2E2E]" />
                    </ScrollArea.Scrollbar>
                  </ScrollArea.Root>
                </div>

                <div className="chat-bottom">
                  <div className="chat-input-container">
                    {error && (
                      <div
                        className="chat-error-message"
                        onAnimationEnd={(e) => {
                          if (e.animationName === "fade-out") {
                            onDismissError?.();
                          }
                        }}
                      >
                        <span>{error}</span>
                        <button
                          onClick={(e) => {
                            e.currentTarget.parentElement?.classList.add("fade-out");
                          }}
                          className="chat-error-dismiss"
                          aria-label="Dismiss error"
                        >
                          ✕
                        </button>
                      </div>
                    )}
                    <ChatInput
                      ref={chatInputRef}
                      onSend={onSendMessage}
                      onStop={onStopGenerating}
                      isLoading={isGenerating}
                    />
                    <div className="chat-disclaimer">
                      By messaging AskAptos, you agree to our{" "}
                      <a
                        href="https://aptoslabs.com/terms"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="chat-disclaimer-link"
                      >
                        Terms
                      </a>{" "}
                      and have read our{" "}
                      <a
                        href="https://aptoslabs.com/privacy"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="chat-disclaimer-link"
                      >
                        Privacy Policy
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </Dialog.Content>
        </div>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
