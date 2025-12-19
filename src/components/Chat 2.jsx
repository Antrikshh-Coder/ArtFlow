import { useState, useEffect, useRef } from "react";
import API from "../api/api";
import { socket, connectSocket } from "../services/socket";
import "./Chat.css";

export default function Chat({ projectId }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");
  const messagesEndRef = useRef(null);

  const normalizeMessage = (msg) => {
    return {
      _id: msg._id || msg.id,
      sender: {
        _id: msg.sender?._id || msg.sender?.id,
        name: msg.sender?.name || "Unknown"
      },
      content: msg.content,
      createdAt: msg.createdAt || msg.timestamp || new Date().toISOString()
    };
  };

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem("user");
    if (userData) {
      const parsedUser = JSON.parse(userData);
      setUser(parsedUser);
    }
  }, [projectId]);

  useEffect(() => {
    if (!user) return;

    // Fetch existing messages
    const fetchMessages = async () => {
      try {
        setError("");
        const res = await API.get(`/chat/project/${projectId}`);
        setMessages((res.data || []).map(normalizeMessage));
        setLoading(false);
      } catch (err) {
        console.error("Failed to fetch messages:", err);
        setError(err.response?.data?.error || err.response?.data?.message || "Failed to load chat");
        setLoading(false);
      }
    };

    fetchMessages();

    connectSocket();

    const onNewMessage = (msg) => {
      const normalized = normalizeMessage(msg);
      setMessages((prev) => {
        if (prev.some((m) => String(m._id) === String(normalized._id))) return prev;
        return [...prev, normalized];
      });
    };

    socket.emit("join-project", projectId, (ack) => {
      if (ack && ack.ok === false) {
        setError(ack.message || "Failed to join chat");
      }
    });
    socket.on("chat:new", onNewMessage);

    return () => {
      socket.off("chat:new", onNewMessage);
      socket.emit("leave-project", projectId);
    };
  }, [projectId, user]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;

    if (!user) return;

    const userId = user?._id || user?.id;

    const messageData = {
      content: newMessage.trim()
    };

    let tempMessage = null;

    try {
      setError("");
      // Add message immediately to UI for better UX
      tempMessage = {
        _id: `temp_${Date.now().toString()}`,
        sender: {
          _id: userId,
          name: user.name
        },
        content: newMessage.trim(),
        createdAt: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, tempMessage]);
      setNewMessage("");

      if (socket.connected) {
        socket.emit("chat:send", { projectId, content: messageData.content }, (ack) => {
          if (!ack?.ok) {
            setError(ack?.message || "Failed to send message");
            setMessages((prev) => prev.filter((m) => m._id !== tempMessage._id));
            return;
          }
          const saved = normalizeMessage(ack.message);
          setMessages((prev) => prev.map((m) => (m._id === tempMessage._id ? saved : m)));
        });
      } else {
        const res = await API.post(`/chat/project/${projectId}`, messageData);
        const saved = normalizeMessage(res.data);
        setMessages(prev => prev.map(m => (m._id === tempMessage._id ? saved : m)));
      }
    } catch (err) {
      console.error("Failed to send message:", err);
      setError(err.response?.data?.error || err.response?.data?.message || "Failed to send message");
      // Remove the temp message if it failed to save
      if (tempMessage) {
        setMessages(prev => prev.filter(msg => msg._id !== tempMessage._id));
      }
    }
  };

  if (loading) {
    return (
      <div className="chat-container">
        <div className="chat-loading">Loading chat...</div>
      </div>
    );
  }

  return (
    <div className="chat-container">
      <div className="chat-header">
        <h3>Project Chat</h3>
      </div>

      {error ? (
        <div style={{ padding: "0.75rem 1rem", color: "var(--muted)" }}>{error}</div>
      ) : null}
      
      <div className="chat-messages">
        {!error && messages.length === 0 ? (
          <div style={{ color: "var(--muted)", fontStyle: "italic" }}>No messages yet</div>
        ) : null}
        {messages.map((msg) => (
          <div
            key={msg._id}
            className={`message ${(msg.sender?._id && (msg.sender._id === (user?._id || user?.id))) ? "sent" : "received"}`}
          >
            <div className="message-info">
              <span className="sender">{msg.sender.name}</span>
              <span className="time">
                {new Date(msg.createdAt).toLocaleTimeString()}
              </span>
            </div>
            <p className="message-content">{msg.content}</p>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder="Type your message..."
          onKeyPress={(e) => e.key === "Enter" && sendMessage()}
        />
        <button onClick={sendMessage}>Send</button>
      </div>
    </div>
  );
}
