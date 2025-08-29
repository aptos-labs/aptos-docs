import * as Dialog from "@radix-ui/react-dialog";
import { Copy, X } from "lucide-react";
import { useState } from "react";
import type { ShareChatResponse } from "@aptos-labs/ai-chatbot-client";

interface ShareModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onShare: (options: { title?: string; expiresInHours?: number }) => Promise<ShareChatResponse>;
}

export function ShareModal({ open, onOpenChange, onShare }: ShareModalProps) {
  const [step, setStep] = useState<"config" | "url">("config");
  const [title, setTitle] = useState("");
  const [expiresInHours, setExpiresInHours] = useState<number | undefined>(undefined);
  const [shareUrl, setShareUrl] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleShare = async () => {
    try {
      setIsLoading(true);
      const response = await onShare({
        title: title || undefined,
        expiresInHours,
      });
      if (!response.share_url) {
        throw new Error("Failed to get share URL. Please try again.");
      }
      setShareUrl(response.share_url);
      setStep("url");
    } catch (error) {
      console.error("Failed to share chat:", error);
      // Show error message to user
      alert(error instanceof Error ? error.message : "Failed to share chat. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
    // Reset state after animation
    setTimeout(() => {
      setStep("config");
      setTitle("");
      setExpiresInHours(undefined);
      setShareUrl("");
    }, 300);
  };

  const [isCopied, setIsCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setIsCopied(true);
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy URL:", error);
    }
  };

  return (
    <Dialog.Root open={open} onOpenChange={handleClose}>
      <Dialog.Portal>
        <Dialog.Overlay className="chat-dialog-overlay" />
        <Dialog.Content className="chat-share-modal">
          <div className="chat-share-header">
            <Dialog.Title className="chat-share-title">Share Chat</Dialog.Title>
            <Dialog.Close className="chat-button">
              <X className="h-5 w-5" />
            </Dialog.Close>
          </div>

          {step === "config" ? (
            <div className="chat-share-content">
              <p className="chat-share-description">
                Create a public link to share this conversation. Anyone with the link can view and
                continue the chat.
              </p>

              <div className="chat-share-form">
                <div className="chat-share-field">
                  <label htmlFor="title" className="chat-share-label">
                    Chat Title (optional)
                  </label>
                  <input
                    id="title"
                    type="text"
                    value={title}
                    onChange={(e) => {
                      setTitle(e.target.value);
                    }}
                    placeholder="Fork: shared chat to learn more"
                    className="chat-share-input"
                  />
                </div>

                <div className="chat-share-field">
                  <label htmlFor="expiration" className="chat-share-label">
                    Expiration (optional)
                  </label>
                  <select
                    id="expiration"
                    value={expiresInHours?.toString() ?? "never"}
                    onChange={(e) => {
                      const value = e.target.value;
                      setExpiresInHours(value === "never" ? undefined : Number(value));
                    }}
                    className="chat-share-select"
                  >
                    <option value="never">Never expires</option>
                    <option value="24">24 hours</option>
                    <option value="72">3 days</option>
                    <option value="168">7 days</option>
                  </select>
                </div>
              </div>

              <div className="chat-share-actions">
                <button onClick={handleClose} className="chat-button-secondary">
                  Cancel
                </button>
                <button onClick={handleShare} disabled={isLoading} className="chat-button-primary">
                  Create Share Link
                </button>
              </div>
            </div>
          ) : (
            <div className="chat-share-content">
              <div className="chat-share-field">
                <label className="chat-share-label">Share URL</label>
                <div className="chat-share-url">
                  <input type="text" value={shareUrl} readOnly className="chat-share-input" />
                  <button onClick={handleCopy} className="chat-button-icon">
                    <Copy className={`h-5 w-5 ${isCopied ? "text-green-500" : ""}`} />
                  </button>
                </div>
              </div>

              <div className="chat-share-note">
                <p>
                  Note: Anyone with this link can view the conversation and continue chatting. Each
                  visitor gets their own private copy of the conversation.
                </p>
              </div>

              <div className="chat-share-actions">
                <button onClick={handleClose} className="chat-button-primary">
                  Done
                </button>
              </div>
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
