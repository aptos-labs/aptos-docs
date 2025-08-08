import * as React from "react";
import { Root as ScrollAreaRoot, Viewport, Scrollbar, Thumb } from "@radix-ui/react-scroll-area";
import { MessageCircle, Pencil, Trash2 } from "lucide-react";
import type { Chat } from "./types";

export interface ChatSidebarProps {
  chats?: Chat[];
  currentChatId?: string;
  onSelectChat?: (chatId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  onUpdateChatTitle?: (chatId: string, title: string) => void;
  onNewChat?: () => void;
  fastMode?: boolean;
  onToggleFastMode?: (enabled: boolean) => void;
  className?: string;
  isCollapsed?: boolean;
}

interface GroupedChats {
  today: Chat[];
  previous: Chat[];
}

const isValidChat = (chat: Chat | undefined): chat is Chat => {
  return Boolean(chat?.id && chat.title && chat.timestamp);
};

const groupChatsByDate = (chats: Chat[]): GroupedChats => {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  return chats.reduce<GroupedChats>(
    (groups, chat) => {
      if (!isValidChat(chat)) return groups;
      const chatDate = new Date(chat.timestamp);
      if (chatDate >= today) {
        groups.today.push(chat);
      } else if (chatDate >= thirtyDaysAgo) {
        groups.previous.push(chat);
      }
      return groups;
    },
    { today: [], previous: [] },
  );
};

const ChatList = ({
  chats,
  currentChatId,
  editingChatId,
  editingTitle,
  isCollapsed,
  onSelectChat,
  onDeleteChat,
  handleEditStart,
  handleKeyDown,
  setEditingTitle,
}: {
  chats: Chat[];
  currentChatId?: string | null;
  editingChatId: string | null;
  editingTitle: string;
  isCollapsed: boolean;
  onSelectChat?: (chatId: string) => void;
  onDeleteChat?: (chatId: string) => void;
  handleEditStart: (chat: Chat) => void;
  handleKeyDown: (e: React.KeyboardEvent) => void;
  setEditingTitle: (title: string) => void;
}) => (
  <>
    {chats.map((chat) => {
      if (!isValidChat(chat)) return null;
      return (
        <div
          key={chat.id}
          className={`chat-sidebar-item${currentChatId === chat.id ? " active" : ""}`}
        >
          <MessageCircle className="chat-sidebar-icon" />
          {!isCollapsed && (
            <>
              {editingChatId === chat.id ? (
                <input
                  type="text"
                  value={editingTitle}
                  onChange={(e) => {
                    setEditingTitle(e.target.value);
                  }}
                  onKeyDown={handleKeyDown}
                  className="chat-sidebar-input"
                  autoFocus
                />
              ) : (
                <button
                  onClick={() => {
                    if (chat.id) {
                      onSelectChat?.(chat.id);
                    }
                  }}
                  className="chat-sidebar-button"
                >
                  {chat.title}
                </button>
              )}
              <div className="chat-sidebar-actions">
                <button
                  onClick={() => {
                    handleEditStart(chat);
                  }}
                  className="chat-sidebar-action"
                >
                  <Pencil className="chat-sidebar-action-icon" />
                </button>
                <button
                  onClick={() => {
                    if (chat.id) {
                      onDeleteChat?.(chat.id);
                    }
                  }}
                  className="chat-sidebar-action"
                >
                  <Trash2 className="chat-sidebar-action-icon" />
                </button>
              </div>
            </>
          )}
        </div>
      );
    })}
  </>
);

export function ChatSidebar({
  chats = [],
  currentChatId,
  onSelectChat,
  onDeleteChat,
  onUpdateChatTitle,
  fastMode = false,
  onToggleFastMode,
  className,
  isCollapsed = false,
}: ChatSidebarProps) {
  const [editingChatId, setEditingChatId] = React.useState<string | null>(null);
  const [editingTitle, setEditingTitle] = React.useState("");

  const groupedChats = React.useMemo(() => groupChatsByDate(chats), [chats]);

  const handleEditStart = (chat: Chat) => {
    if (!isValidChat(chat)) return;
    setEditingChatId(chat.id);
    setEditingTitle(chat.title);
  };

  const handleEditSave = () => {
    if (editingChatId && editingTitle.trim() && onUpdateChatTitle) {
      onUpdateChatTitle(editingChatId, editingTitle.trim());
    }
    setEditingChatId(null);
  };

  const handleEditCancel = () => {
    setEditingChatId(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleEditSave();
    } else if (e.key === "Escape") {
      handleEditCancel();
    }
  };

  return (
    <div
      className={`chat-sidebar${isCollapsed ? " collapsed" : ""}${className ? ` ${className}` : ""}`}
    >
      <ScrollAreaRoot className="chat-sidebar-scroll">
        <Viewport className="chat-sidebar-viewport">
          <div className="chat-sidebar-content">
            {!isCollapsed && groupedChats.today.length > 0 && (
              <div className="chat-sidebar-group">
                <h2 className="chat-sidebar-group-title">Today</h2>
              </div>
            )}
            <ChatList
              chats={groupedChats.today}
              currentChatId={currentChatId}
              editingChatId={editingChatId}
              editingTitle={editingTitle}
              isCollapsed={isCollapsed}
              onSelectChat={onSelectChat}
              onDeleteChat={onDeleteChat}
              handleEditStart={handleEditStart}
              handleKeyDown={handleKeyDown}
              setEditingTitle={setEditingTitle}
            />

            {!isCollapsed && groupedChats.previous.length > 0 && (
              <div className="chat-sidebar-group">
                <h2 className="chat-sidebar-group-title">Previous 30 Days</h2>
              </div>
            )}
            <ChatList
              chats={groupedChats.previous}
              currentChatId={currentChatId}
              editingChatId={editingChatId}
              editingTitle={editingTitle}
              isCollapsed={isCollapsed}
              onSelectChat={onSelectChat}
              onDeleteChat={onDeleteChat}
              handleEditStart={handleEditStart}
              handleKeyDown={handleKeyDown}
              setEditingTitle={setEditingTitle}
            />
          </div>
        </Viewport>
        <Scrollbar orientation="vertical">
          <Thumb className="chat-scrollbar-thumb" />
        </Scrollbar>
      </ScrollAreaRoot>

      <div className="chat-sidebar-footer">
        {!isCollapsed && (
          <div className="chat-fast-mode">
            <label className="chat-fast-mode-label">
              <input
                type="checkbox"
                checked={fastMode}
                onChange={(e) => onToggleFastMode?.(e.target.checked)}
                className="chat-fast-mode-checkbox"
              />
              <span className="chat-fast-mode-text">Fast mode</span>
            </label>
            <p className="chat-fast-mode-description">Might provide less accurate answers</p>
          </div>
        )}
      </div>
    </div>
  );
}
