import React, { useState, useEffect, useRef } from "react";
import { Pencil, Trash2, Reply, X, Send } from "lucide-react";

interface Message {
  id: number;
  sender: "Me" | "CEO" | "Regional Officer";
  recipient: "CEO" | "Regional Officer" | "Me";
  content: string;
  timestamp: number; // unix timestamp for sorting/display
}

const CommunicationCenter = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [activeChat, setActiveChat] = useState<"CEO" | "Regional Officer">("CEO");
  const [content, setContent] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Mock initial messages
  useEffect(() => {
    setMessages([
      {
        id: 1,
        sender: "CEO",
        recipient: "Me",
        content: "Please update the monthly report.",
        timestamp: Date.now() - 1000 * 60 * 60 * 24 * 2,
      },
      {
        id: 2,
        sender: "Regional Officer",
        recipient: "Me",
        content: "Ensure bus maintenance is completed this week.",
        timestamp: Date.now() - 1000 * 60 * 60 * 24,
      },
      {
        id: 3,
        sender: "Me",
        recipient: "CEO",
        content: "Report has been submitted.",
        timestamp: Date.now() - 1000 * 60 * 60 * 12,
      },
      {
        id: 4,
        sender: "CEO",
        recipient: "Me",
        content: "Thanks! Well done.",
        timestamp: Date.now() - 1000 * 60 * 60 * 6,
      },
    ]);
  }, []);

  // Scroll chat to bottom on messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChat]);

  // Filter messages relevant to the current conversation
  const currentChatMessages = messages
    .filter(
      (msg) =>
        (msg.sender === "Me" && msg.recipient === activeChat) ||
        (msg.sender === activeChat && msg.recipient === "Me")
    )
    .sort((a, b) => a.timestamp - b.timestamp);

  const handleSend = () => {
    if (content.trim() === "") return;

    if (editingId !== null) {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === editingId ? { ...msg, content, timestamp: Date.now() } : msg
        )
      );
      setEditingId(null);
    } else if (replyingTo !== null) {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: "Me",
          recipient: replyingTo.sender as "CEO" | "Regional Officer",
          content,
          timestamp: Date.now(),
        },
      ]);
      setReplyingTo(null);
    } else {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now(),
          sender: "Me",
          recipient: activeChat,
          content,
          timestamp: Date.now(),
        },
      ]);
    }

    setContent("");
  };

  const handleEdit = (id: number) => {
    const msg = messages.find((m) => m.id === id);
    if (msg) {
      setContent(msg.content);
      setEditingId(id);
      setReplyingTo(null);
    }
  };

  const handleDelete = (id: number) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const handleReply = (msg: Message) => {
    setReplyingTo(msg);
    setEditingId(null);
    setContent("");
  };

  const cancelReply = () => setReplyingTo(null);
  const cancelEdit = () => {
    setEditingId(null);
    setContent("");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-4 border-b border-gray-300 flex items-center justify-between">
        <h1 className="text-xl font-semibold">Communication Center</h1>
        <select
          className="border rounded px-3 py-1"
          value={activeChat}
          onChange={(e) => {
            setActiveChat(e.target.value as "CEO" | "Regional Officer");
            setReplyingTo(null);
            setEditingId(null);
            setContent("");
          }}
        >
          <option value="CEO">CEO</option>
          <option value="Regional Officer">Regional Operations Officer</option>
        </select>
      </div>

      {/* Chat messages container */}
      <div
        className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-4"
        style={{ scrollbarWidth: "thin" }}
      >
        {currentChatMessages.length === 0 ? (
          <p className="text-gray-400 text-center mt-10">No messages yet.</p>
        ) : (
          currentChatMessages.map((msg) => {
            const isMe = msg.sender === "Me";
            return (
              <div
                key={msg.id}
                className={`flex ${isMe ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[70%] p-3 rounded-lg shadow ${
                    isMe
                      ? "bg-blue-600 text-white rounded-br-none"
                      : "bg-white text-gray-800 rounded-bl-none border border-gray-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    {!isMe && (
                      <span className="font-semibold text-sm text-blue-600">
                        {msg.sender}
                      </span>
                    )}
                    <span className="text-xs text-gray-400 ml-2">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                  <p className="whitespace-pre-wrap">{msg.content}</p>

                  {/* Actions */}
                  <div className="flex gap-3 mt-2 justify-end">
                    {isMe ? (
                      <>
                        <button
                          onClick={() => handleEdit(msg.id)}
                          title="Edit"
                          className="hover:text-blue-300"
                        >
                          <Pencil size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(msg.id)}
                          title="Delete"
                          className="hover:text-red-400"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleReply(msg)}
                        title="Reply"
                        className="hover:text-green-500"
                      >
                        <Reply size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input area */}
      <div className="border-t border-gray-300 p-4 bg-white">
        {replyingTo && (
          <div className="mb-2 flex items-center justify-between bg-gray-100 p-2 rounded">
            <div>
              Replying to{" "}
              <span className="font-semibold">{replyingTo.sender}</span>: "
              <span className="italic truncate max-w-xs inline-block">
                {replyingTo.content}
              </span>
              "
            </div>
            <button
              onClick={cancelReply}
              title="Cancel Reply"
              className="text-gray-500 hover:text-gray-700"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {editingId !== null && (
          <div className="mb-2 flex items-center justify-between bg-yellow-100 p-2 rounded">
            <div>Editing message</div>
            <button
              onClick={cancelEdit}
              title="Cancel Edit"
              className="text-gray-700 hover:text-gray-900"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {/* Input and Send Icon container */}
        <div className="flex items-center gap-2">
          <textarea
            rows={3}
            className="flex-1 border border-gray-300 rounded p-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder={
              replyingTo
                ? `Replying to ${replyingTo.sender}...`
                : editingId !== null
                ? "Edit your message..."
                : "Type a message..."
            }
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
          />

          <button
            onClick={handleSend}
            disabled={content.trim() === ""}
            title={
              editingId !== null
                ? "Update message"
                : replyingTo
                ? "Send reply"
                : "Send message"
            }
            className="p-3 rounded-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="text-white" size={24} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CommunicationCenter;
