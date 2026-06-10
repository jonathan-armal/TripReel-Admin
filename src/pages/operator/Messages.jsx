import { useState, useEffect, useRef } from "react";
import {
  MessageCircle,
  Send,
  Paperclip,
  ArrowLeft,
  User,
  Clock,
} from "lucide-react";
import { operatorChatAPI } from "../../services/api";
import { useOperatorAuth } from "../../context/OperatorAuthContext";
import io from "socket.io-client";

const isLocal =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1";
const SOCKET_URL = isLocal
  ? "http://localhost:5001"
  : "https://api.tripreel.in";

function fmtTime(d) {
  if (!d) return "";
  const date = new Date(d);
  const now = new Date();
  const diff = now - date;
  if (diff < 86400000)
    return date.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
    });
  if (diff < 172800000) return "Yesterday";
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

export default function OperatorMessages() {
  const { operator } = useOperatorAuth();
  const [conversations, setConversations] = useState([]);
  const [selectedConv, setSelectedConv] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [msgLoading, setMsgLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Fetch conversations
  useEffect(() => {
    operatorChatAPI
      .getConversations()
      .then((res) => setConversations(res.data?.conversations || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  // WebSocket
  useEffect(() => {
    const token = localStorage.getItem("operatorToken");
    if (!token) return;

    const socket = io(SOCKET_URL, {
      auth: { token, userType: "operator" },
      transports: ["websocket"],
    });

    socket.on("new_message", (msg) => {
      if (selectedConv && msg.conversationId === selectedConv._id) {
        setMessages((prev) => {
          if (prev.some((m) => m._id === msg._id)) return prev;
          return [...prev, msg];
        });
      }
      setConversations((prev) =>
        prev.map((c) =>
          c._id === msg.conversationId
            ? {
                ...c,
                lastMessage: msg.text || "📷 Image",
                lastMessageAt: msg.createdAt,
                unreadOperator:
                  c._id === selectedConv?._id
                    ? 0
                    : (c.unreadOperator || 0) +
                      (msg.senderType !== "operator" ? 1 : 0),
              }
            : c,
        ),
      );
    });

    socketRef.current = socket;
    return () => socket.disconnect();
  }, []);

  // Join room when conversation selected
  useEffect(() => {
    if (selectedConv && socketRef.current) {
      socketRef.current.emit("join_conversation", selectedConv._id);
      socketRef.current.emit("mark_read", {
        conversationId: selectedConv._id,
      });
      // Clear unread count locally
      setConversations((prev) =>
        prev.map((c) =>
          c._id === selectedConv._id ? { ...c, unreadOperator: 0 } : c,
        ),
      );
      return () =>
        socketRef.current?.emit("leave_conversation", selectedConv._id);
    }
  }, [selectedConv?._id]);

  // Fetch messages
  useEffect(() => {
    if (!selectedConv) return;
    setMsgLoading(true);
    operatorChatAPI
      .getMessages(selectedConv._id)
      .then((res) => setMessages(res.data?.messages || []))
      .catch(() => setMessages([]))
      .finally(() => setMsgLoading(false));
  }, [selectedConv?._id]);

  // Scroll to bottom
  useEffect(() => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "auto" });
    }, 50);
  }, [messages]);

  // Send
  const handleSend = async () => {
    if (!text.trim() || !selectedConv) return;
    const msg = text.trim();
    setText("");
    setSending(true);

    if (socketRef.current?.connected) {
      socketRef.current.emit("send_message", {
        conversationId: selectedConv._id,
        text: msg,
        senderName: operator?.contactName || "",
      });
      setMessages((prev) => [
        ...prev,
        {
          _id: Date.now().toString(),
          conversationId: selectedConv._id,
          senderId: operator?._id,
          senderType: "operator",
          text: msg,
          createdAt: new Date().toISOString(),
        },
      ]);
    } else {
      try {
        const res = await operatorChatAPI.sendMessage(selectedConv._id, {
          text: msg,
        });
        setMessages((prev) => [...prev, res.data.message]);
      } catch {}
    }
    setSending(false);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <>
      <div className="flex h-[calc(100vh-80px)] bg-white rounded-2xl border border-gray-100 overflow-hidden">
        {/* Left — Conversation List */}
        <div
          className={`${selectedConv ? "hidden md:flex" : "flex"} flex-col w-full md:w-80 border-r border-gray-100`}
        >
          <div className="px-4 py-4 border-b border-gray-100">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-teal-600" />
              Messages
            </h2>
            <p className="text-xs text-gray-400 mt-0.5">
              {conversations.length} conversation
              {conversations.length !== 1 ? "s" : ""}
            </p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <MessageCircle className="w-10 h-10 text-gray-300 mb-3" />
                <p className="text-sm text-gray-500">No conversations yet</p>
                <p className="text-xs text-gray-400 mt-1">
                  Conversations appear when users book your packages
                </p>
              </div>
            ) : (
              conversations.map((conv) => {
                const userName = conv.userId?.name || "Traveler";
                const isActive = selectedConv?._id === conv._id;
                return (
                  <div
                    key={conv._id}
                    onClick={() => setSelectedConv(conv)}
                    className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b border-gray-50 transition-colors ${
                      isActive
                        ? "bg-teal-50 border-l-2 border-l-teal-500"
                        : "hover:bg-gray-50"
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                      {conv.userId?.avatar ? (
                        <img
                          src={conv.userId.avatar}
                          className="w-10 h-10 rounded-full object-cover"
                          alt=""
                        />
                      ) : (
                        <User className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-800 truncate">
                          {userName}
                        </p>
                        <span className="text-[10px] text-gray-400 shrink-0">
                          {fmtTime(conv.lastMessageAt)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <p className="text-xs text-gray-500 truncate">
                          {conv.lastMessage || conv.packageTitle}
                        </p>
                        {conv.unreadOperator > 0 && (
                          <span className="w-5 h-5 bg-teal-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shrink-0">
                            {conv.unreadOperator}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right — Chat */}
        <div
          className={`${selectedConv ? "flex" : "hidden md:flex"} flex-col flex-1`}
        >
          {selectedConv ? (
            <>
              {/* Header */}
              <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-100">
                <button
                  onClick={() => setSelectedConv(null)}
                  className="md:hidden p-1"
                >
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
                </button>
                <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">
                    {selectedConv.userId?.name || "Traveler"}
                  </p>
                  <p className="text-xs text-gray-400">
                    {selectedConv.packageTitle}
                  </p>
                </div>
                <div className="ml-auto flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3.5 h-3.5" />
                  Expires{" "}
                  {new Date(selectedConv.expiresAt).toLocaleDateString(
                    "en-IN",
                    {
                      day: "2-digit",
                      month: "short",
                    },
                  )}
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50">
                {msgLoading ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="w-6 h-6 border-2 border-teal-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-sm text-gray-400">
                    No messages yet. Send a welcome message!
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isSent = msg.senderType === "operator";
                    // Date divider
                    const showDate =
                      idx === 0 ||
                      new Date(msg.createdAt).toDateString() !==
                        new Date(messages[idx - 1]?.createdAt).toDateString();
                    return (
                      <div key={msg._id}>
                        {showDate && msg.createdAt && (
                          <div className="flex justify-center my-3">
                            <span className="px-3 py-1 bg-gray-200 rounded-full text-[10px] text-gray-500 font-medium">
                              {new Date(msg.createdAt).toLocaleDateString(
                                "en-IN",
                                {
                                  day: "2-digit",
                                  month: "short",
                                  year: "numeric",
                                },
                              )}
                            </span>
                          </div>
                        )}
                        <div
                          className={`flex ${isSent ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[70%] px-4 py-2.5 rounded-2xl ${
                              isSent
                                ? "bg-teal-500 text-white rounded-tr-sm"
                                : "bg-white text-gray-800 border border-gray-200 rounded-tl-sm"
                            }`}
                          >
                            {msg.imageUrl && (
                              <img
                                src={msg.imageUrl}
                                className="rounded-lg mb-1 max-w-[200px] cursor-pointer hover:opacity-90 transition-opacity"
                                alt=""
                                onClick={() => setPreviewImage(msg.imageUrl)}
                              />
                            )}
                            {msg.text && <p className="text-sm">{msg.text}</p>}
                            <p
                              className={`text-[10px] mt-1 ${isSent ? "text-teal-100" : "text-gray-400"}`}
                            >
                              {fmtTime(msg.createdAt)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input — check if chat expired */}
              {selectedConv.expiresAt &&
              new Date() > new Date(selectedConv.expiresAt) ? (
                <div className="flex items-center justify-center gap-2 px-4 py-4 border-t border-gray-100 bg-gray-50">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <p className="text-sm text-gray-500">
                    Chat ended — trip completed. Messages are read-only.
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-2 px-4 py-3 border-t border-gray-100 bg-white">
                  <button className="p-2 text-gray-400 hover:text-gray-600 transition-colors">
                    <Paperclip className="w-5 h-5" />
                  </button>
                  <input
                    type="text"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) =>
                      e.key === "Enter" && !e.shiftKey && handleSend()
                    }
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2.5 bg-gray-100 rounded-full text-sm outline-none focus:ring-2 focus:ring-teal-400"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!text.trim() || sending}
                    className="w-9 h-9 bg-teal-500 text-white rounded-full flex items-center justify-center hover:bg-teal-600 disabled:opacity-40 transition-colors"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-center">
              <div>
                <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 text-sm">Select a conversation</p>
                <p className="text-gray-400 text-xs mt-1">
                  Choose a traveler to start messaging
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Image Preview Overlay */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
          onClick={() => setPreviewImage(null)}
        >
          <button
            onClick={() => setPreviewImage(null)}
            className="absolute top-6 right-6 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-white hover:bg-white/30 transition-colors"
          >
            ✕
          </button>
          <img
            src={previewImage}
            className="max-w-[90%] max-h-[85vh] object-contain rounded-lg"
            alt=""
          />
        </div>
      )}
    </>
  );
}
