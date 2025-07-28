import { type ComponentProps } from "react";
import { Copy, ThumbsUp, ThumbsDown, Trash2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Message } from "./types";

interface ChatMessageProps extends ComponentProps<"div"> {
  message: Message;
  onDelete?: () => void;
  onCopy?: () => void;
  onFeedback?: (feedback: "positive" | "negative") => void;
}

export function ChatMessage({
  message,
  onDelete,
  onCopy,
  onFeedback,
  className,
  ...props
}: ChatMessageProps) {
  return (
    <div className={`chat-message ${className ?? ""}`} {...props}>
      <div className="chat-message-content">
        <div className="chat-message-text">
          {message.role === "assistant" ? (
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.content}</ReactMarkdown>
          ) : (
            <div className="chat-message-user">{message.content}</div>
          )}
        </div>
        <div className="chat-message-actions">
          {message.role === "assistant" && (
            <>
              <button
                onClick={() => onFeedback?.("positive")}
                className={`chat-message-action ${message.feedback === "positive" ? "chat-message-action-active chat-message-action-positive" : ""}`}
              >
                <ThumbsUp className="chat-button-icon" />
              </button>
              <button
                onClick={() => onFeedback?.("negative")}
                className={`chat-message-action ${message.feedback === "negative" ? "chat-message-action-active chat-message-action-negative" : ""}`}
              >
                <ThumbsDown className="chat-button-icon" />
              </button>
            </>
          )}
          <button onClick={onCopy} className="chat-message-action">
            <Copy className="chat-button-icon" />
          </button>
          <button onClick={onDelete} className="chat-message-action">
            <Trash2 className="chat-button-icon" />
          </button>
        </div>
      </div>
    </div>
  );
}
