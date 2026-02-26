import { ArrowRight, StopCircle } from "lucide-react";
import { forwardRef, useImperativeHandle, useRef, useState } from "react";

export interface ChatInputRef {
  focus: () => void;
  clear: () => void;
}

interface ChatInputProps {
  onSend?: (message: string) => void;
  onStop?: () => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export const ChatInput = forwardRef<ChatInputRef, ChatInputProps>(function ChatInput(
  { onSend, onStop, isLoading, disabled },
  ref,
) {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useImperativeHandle(ref, () => ({
    focus: () => textareaRef.current?.focus(),
    clear: () => {
      setMessage("");
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }
    },
  }));

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const textarea = e.target;
    setMessage(textarea.value);

    // Auto-resize textarea
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120).toString()}px`;
  };

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!message.trim()) return;
    onSend?.(message);
    setMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="chat-input-form">
      <div className="chat-input-wrapper">
        <textarea
          ref={textareaRef}
          value={message}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          placeholder="Ask about Aptos and Move"
          rows={1}
          className={`chat-input ${disabled ? "chat-input-disabled" : ""}`}
          disabled={disabled}
        />
      </div>
      {isLoading ? (
        <button type="button" onClick={onStop} className="chat-input-button chat-input-button-stop">
          <StopCircle className="chat-button-icon" />
        </button>
      ) : (
        <button
          type="submit"
          disabled={!message.trim()}
          className={`chat-input-button ${message.trim() ? "chat-input-button-active" : ""}`}
        >
          <ArrowRight className="chat-button-icon" />
        </button>
      )}
    </form>
  );
});
