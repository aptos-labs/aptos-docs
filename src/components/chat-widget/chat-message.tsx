import { type ComponentProps, useState } from "react";
import { Copy, ThumbsUp, ThumbsDown } from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/cjs/styles/prism";
import type { Message } from "./types";

interface ChatMessageProps extends ComponentProps<"div"> {
  message: Message;
  onCopy?: () => void;
  onFeedback?: (messageId: string, feedback: "positive" | "negative") => void;
}

export function ChatMessage({
  message,
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
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ children }) => <h1 className="chat-message-h1">{children}</h1>,
                h2: ({ children }) => <h2 className="chat-message-h2">{children}</h2>,
                h3: ({ children }) => <h3 className="chat-message-h3">{children}</h3>,
                h4: ({ children }) => <h4 className="chat-message-h4">{children}</h4>,
                h5: ({ children }) => <h5 className="chat-message-h5">{children}</h5>,
                h6: ({ children }) => <h6 className="chat-message-h6">{children}</h6>,
                strong: ({ children }) => (
                  <strong className="chat-message-strong">{children}</strong>
                ),
                code: ({ className, children }) => {
                  // Check if code is inline by seeing if it's a single line
                  const isInline = !className;
                  const match = /language-(\w+)/.exec(className ?? "");
                  // Use the inline prop to determine if it's inline code
                  if (isInline) {
                    return <code>{children}</code>;
                  }

                  // For code blocks, use syntax highlighting
                  const language = match ? match[1] : "move";
                  const finalLanguage = language === "move" ? "rust" : language;

                  const childArray = Array.isArray(children) ? children : [children];
                  const content = childArray
                    .map((child) => (typeof child === "string" ? child : ""))
                    .join("")
                    .trim();

                  const [isCopied, setIsCopied] = useState(false);

                  const handleCopy = async (e: React.MouseEvent) => {
                    e.stopPropagation();
                    try {
                      await navigator.clipboard.writeText(content);
                      setIsCopied(true);
                      setTimeout(() => {
                        setIsCopied(false);
                      }, 2000);
                    } catch (err) {
                      console.error("Failed to copy:", err);
                    }
                  };

                  return (
                    <div className="code-block-wrapper">
                      <button
                        className="code-copy-button"
                        onClick={handleCopy}
                        aria-label="Copy code"
                      >
                        <Copy className={`code-copy-icon ${isCopied ? "copied" : ""}`} />
                      </button>
                      <SyntaxHighlighter
                        style={vscDarkPlus}
                        language={finalLanguage}
                        PreTag="div"
                        customStyle={{
                          margin: "0",
                          padding: "0.75rem 1rem",
                          background: "var(--sl-color-gray-6)",
                          borderRadius: "0.5rem",
                          display: "inline-block",
                          minWidth: "100%",
                        }}
                        codeTagProps={{
                          style: {
                            fontSize: "0.9em",
                            lineHeight: "1.5",
                          },
                        }}
                        wrapLines={true}
                        showLineNumbers={false}
                      >
                        {content.replace(/\n$/, "")}
                      </SyntaxHighlighter>
                    </div>
                  );
                },
              }}
            >
              {message.content}
            </ReactMarkdown>
          ) : (
            <div className="chat-message-user">{message.content}</div>
          )}
        </div>
        <div className="chat-message-actions">
          {message.role === "assistant" && (
            <>
              <button
                onClick={() => {
                  onFeedback?.(message.id, "positive");
                }}
                className={`chat-message-action ${message.feedback === "positive" ? "chat-message-action-active chat-message-action-positive" : ""}`}
              >
                <ThumbsUp className="chat-button-icon" />
              </button>
              <button
                onClick={() => {
                  onFeedback?.(message.id, "negative");
                }}
                className={`chat-message-action ${message.feedback === "negative" ? "chat-message-action-active chat-message-action-negative" : ""}`}
              >
                <ThumbsDown className="chat-button-icon" />
              </button>
            </>
          )}
          <button onClick={onCopy} className="chat-message-action">
            <Copy className="chat-button-icon" />
          </button>
        </div>
      </div>
    </div>
  );
}
