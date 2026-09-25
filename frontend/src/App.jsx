import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import "./App.css";

function App() {
  const API_URL = "http://localhost:8080";

  // ==========================================
  // AUTHENTICATION
  // ==========================================

  const [token, setToken] = useState(
    localStorage.getItem("nova_token")
  );

  const [authMode, setAuthMode] = useState("login");
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const [conversations, setConversations] = useState([]);
  const [currentConversationId, setCurrentConversationId] =
    useState(null);

  const [conversationSearch, setConversationSearch] = useState("");

  const [darkMode, setDarkMode] = useState(false);

  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

  const [copiedMessageIndex, setCopiedMessageIndex] = useState(null);

  const [regeneratingMessageIndex, setRegeneratingMessageIndex] =
    useState(null);

  const fileInputRef = useRef(null);


  // ==========================================
  // AUTH HELPERS
  // ==========================================

  const getAuthHeaders = () => {
    const currentToken = localStorage.getItem("nova_token");

    return currentToken
      ? { Authorization: `Bearer ${currentToken}` }
      : {};
  };

  const getErrorMessage = async (response, fallback) => {
    try {
      const text = await response.text();

      if (text && text.trim()) {
        try {
          const data = JSON.parse(text);
          return data.message || fallback;
        } catch {
          return text;
        }
      }
    } catch {
      // Use fallback.
    }

    return fallback;
  };

  const logout = () => {
    localStorage.removeItem("nova_token");
    localStorage.removeItem("nova_email");
    localStorage.removeItem("nova_name");

    setToken(null);
    setMessages([]);
    setConversations([]);
    setCurrentConversationId(null);
    setMessage("");
    setCopiedMessageIndex(null);
    setRegeneratingMessageIndex(null);
    removeImage();
  };

  const handleLogin = async (event) => {
    event.preventDefault();
    setAuthError("");

    const email = authEmail.trim().toLowerCase();

    if (!email || !authPassword.trim()) {
      setAuthError("Please enter your email and password.");
      return;
    }

    if (!email.endsWith("@gmail.com")) {
      setAuthError("Please use a valid Gmail ID ending with @gmail.com.");
      return;
    }

    setAuthLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email,
            password: authPassword,
          }),
        }
      );

      if (!response.ok) {
        const errorMessage = await getErrorMessage(
          response,
          "Login failed. Please try again."
        );

        const normalizedMessage = errorMessage.toLowerCase();

        if (
          normalizedMessage.includes("user not found") ||
          normalizedMessage.includes("not registered")
        ) {
          throw new Error(
            "Email ID is not registered. Please register first."
          );
        }

        if (
          normalizedMessage.includes("invalid password") ||
          normalizedMessage.includes("incorrect password")
        ) {
          throw new Error(
            "Incorrect password. Please try again."
          );
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      localStorage.setItem("nova_token", data.token);
      localStorage.setItem("nova_email", email);

      setToken(data.token);
      setAuthEmail("");
      setAuthPassword("");
      setAuthError("");
    } catch (error) {
      console.error("Login error:", error);
      setAuthError(error.message || "Login failed. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  };

  const handleRegister = async (event) => {
    event.preventDefault();
    setAuthError("");

    const email = authEmail.trim().toLowerCase();

    if (!authName.trim() || !email || !authPassword) {
      setAuthError("Please fill in all fields.");
      return;
    }

    if (!email.endsWith("@gmail.com")) {
      setAuthError("Email must end with @gmail.com.");
      return;
    }

    const passwordHasMinimumLength = authPassword.length >= 8;
    const passwordHasUppercase = /[A-Z]/.test(authPassword);
    const passwordHasLowercase = /[a-z]/.test(authPassword);
    const passwordHasNumber = /[0-9]/.test(authPassword);
    const passwordHasSpecial = /[^A-Za-z0-9]/.test(authPassword);

    if (
      !passwordHasMinimumLength ||
      !passwordHasUppercase ||
      !passwordHasLowercase ||
      !passwordHasNumber ||
      !passwordHasSpecial
    ) {
      setAuthError(
        "Password must be at least 8 characters and include at least one uppercase letter, one lowercase letter, one number, and one special character."
      );
      return;
    }

    setAuthLoading(true);

    try {
      const response = await fetch(
        `${API_URL}/api/auth/register`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: authName.trim(),
            email,
            password: authPassword,
          }),
        }
      );

      if (!response.ok) {
        const errorMessage = await getErrorMessage(
          response,
          "Registration failed."
        );

        const normalizedMessage = errorMessage.toLowerCase();

        if (
          normalizedMessage.includes("email already") ||
          normalizedMessage.includes("already registered")
        ) {
          throw new Error(
            "Email ID already exists. Please login."
          );
        }

        throw new Error(errorMessage);
      }

      // Registration is complete.
      // Do NOT automatically log the user in.
      setAuthMode("login");
      setAuthName("");
      setAuthEmail("");
      setAuthPassword("");
      setAuthError(
        "Registration successful. Please login."
      );
    } catch (error) {
      console.error("Registration error:", error);
      setAuthError(
        error.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setAuthLoading(false);
    }
  };

  // ==========================================
  // LOAD CONVERSATIONS WHEN APP STARTS
  // ==========================================

  useEffect(() => {
    if (token) {
      loadConversations();
    }
  }, [token]);


  // ==========================================
  // LOAD ALL CONVERSATIONS
  // ==========================================

  const loadConversations = async () => {
    try {
      const response = await fetch(
        `${API_URL}/api/conversations`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load conversations"
        );
      }

      const data = await response.json();

      setConversations(data);

      return data;

    } catch (error) {
      console.error(
        "Conversation loading error:",
        error
      );

      return [];
    }
  };


  // ==========================================
  // LOAD MESSAGES OF A CONVERSATION
  // ==========================================

  const loadConversation = async (
    conversationId
  ) => {
    try {
      setIsLoading(true);

      const response = await fetch(
        `${API_URL}/api/conversations/${conversationId}/messages`,
        { headers: getAuthHeaders() }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to load messages"
        );
      }

      const data = await response.json();

      const formattedMessages = data.map(
        (item) => ({
          sender: item.sender,
          content: item.content,
        })
      );

      setMessages(formattedMessages);

      setCurrentConversationId(
        conversationId
      );

      setCopiedMessageIndex(null);
      setRegeneratingMessageIndex(null);

      removeImage();

    } catch (error) {
      console.error(
        "Message loading error:",
        error
      );

      alert(
        "Could not load this conversation."
      );

    } finally {
      setIsLoading(false);
    }
  };


  // ==========================================
  // DELETE CONVERSATION
  // ==========================================

  const deleteConversation = async (
    conversationId
  ) => {
    const conversation =
      conversations.find(
        (item) =>
          item.id === conversationId
      );

    const title =
      conversation?.title ||
      "this conversation";

    const confirmed = window.confirm(
      `Delete "${title}"?\n\nThis will permanently delete the conversation and all its messages.`
    );

    if (!confirmed) {
      return;
    }

    try {
      const response = await fetch(
        `${API_URL}/api/conversations/${conversationId}`,
        {
          method: "DELETE",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        throw new Error(
          "Failed to delete conversation"
        );
      }

      // Remove chat from sidebar
      setConversations(
        (previous) =>
          previous.filter(
            (conversation) =>
              conversation.id !==
              conversationId
          )
      );

      // If deleted chat is currently open,
      // clear the chat area.
      if (
        currentConversationId ===
        conversationId
      ) {
        setCurrentConversationId(null);
        setMessages([]);
        setMessage("");
        removeImage();
      }

    } catch (error) {
      console.error(
        "Delete conversation error:",
        error
      );

      alert(
        "Could not delete the conversation. Please try again."
      );
    }
  };


  // ==========================================
  // SEND MESSAGE
  // ==========================================

  const sendMessage = async () => {
    if (
      !message.trim() &&
      !selectedImage
    ) {
      return;
    }

    const currentMessage = message;
    const currentImage = selectedImage;
    const currentImagePreview = imagePreview;

    const userMessage = {
      sender: "USER",

      content:
        currentMessage ||
        "Describe this image",

      image: currentImagePreview,
    };

    // Show user message immediately
    setMessages(
      (previous) => [
        ...previous,
        userMessage,
      ]
    );

    setMessage("");
    setSelectedImage(null);
    setImagePreview(null);

    setIsLoading(true);

    try {
      let response;

      // ========================================
      // IMAGE REQUEST
      // ========================================

      if (currentImage) {
        const formData =
          new FormData();

        formData.append(
          "image",
          currentImage
        );

        formData.append(
          "message",
          currentMessage ||
            "Describe this image in detail."
        );

        if (currentConversationId) {
          formData.append(
            "conversationId",
            currentConversationId
          );
        }

        response = await fetch(
          `${API_URL}/api/chat/image`,
          {
            method: "POST",
            headers: getAuthHeaders(),
            body: formData,
          }
        );
      }

      // ========================================
      // NORMAL TEXT REQUEST
      // ========================================

      else {
        let url =
          `${API_URL}/api/chat`;

        if (currentConversationId) {
          url +=
            `?conversationId=${currentConversationId}`;
        }

        response = await fetch(
          url,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "text/plain",
              ...getAuthHeaders(),
            },

            body: currentMessage,
          }
        );
      }

      if (!response.ok) {
        throw new Error(
          `Server error: ${response.status}`
        );
      }

      const data =
        await response.json();

      // ========================================
      // AI RESPONSE
      // ========================================

      const aiMessage = {
        sender: "AI",

        content:
          data.content ||
          "I couldn't generate a response.",
      };

      setMessages(
        (previous) => [
          ...previous,
          aiMessage,
        ]
      );


      // ========================================
      // REFRESH SIDEBAR
      // ========================================

      const updatedConversations =
        await loadConversations();


      // ========================================
      // IMPORTANT:
      // If this was the first message of a new
      // chat, find the newly created conversation.
      // ========================================

      if (!currentConversationId) {
        if (
          updatedConversations &&
          updatedConversations.length > 0
        ) {
          const newestConversation =
            updatedConversations[0];

          setCurrentConversationId(
            newestConversation.id
          );
        }
      }

    } catch (error) {
      console.error(
        "Chat error:",
        error
      );

      const errorMessage = {
        sender: "AI",

        content:
          "Sorry, something went wrong while processing your request. Please try again.",
      };

      setMessages(
        (previous) => [
          ...previous,
          errorMessage,
        ]
      );

    } finally {
      setIsLoading(false);
    }
  };


  // ==========================================
  // COPY AI RESPONSE
  // ==========================================

  const copyAIResponse = async (
    content,
    messageIndex
  ) => {
    try {
      await navigator.clipboard.writeText(
        content
      );

      setCopiedMessageIndex(
        messageIndex
      );

      setTimeout(() => {
        setCopiedMessageIndex(null);
      }, 1500);

    } catch (error) {
      console.error(
        "Copy failed:",
        error
      );

      alert(
        "Could not copy the response."
      );
    }
  };


  // ==========================================
  // REGENERATE AI RESPONSE
  // ==========================================

  const regenerateResponse = async (
    messageIndex
  ) => {
    if (
      !currentConversationId ||
      regeneratingMessageIndex !== null
    ) {
      return;
    }

    setRegeneratingMessageIndex(
      messageIndex
    );

    try {
      const response = await fetch(
        `${API_URL}/api/chat/regenerate?conversationId=${currentConversationId}`,
        {
          method: "POST",
          headers: getAuthHeaders(),
        }
      );

      if (!response.ok) {
        const errorText =
          await response.text();

        throw new Error(
          errorText ||
            "Failed to regenerate response."
        );
      }

      const data =
        await response.json();

      const regeneratedContent =
        data.content ||
        "I couldn't generate a new response.";

      setMessages(
        (previous) =>
          previous.map(
            (item, index) =>
              index === messageIndex
                ? {
                    ...item,
                    sender: "AI",
                    content:
                      regeneratedContent,
                  }
                : item
          )
      );

      setCopiedMessageIndex(null);

    } catch (error) {
      console.error(
        "Regenerate error:",
        error
      );

      alert(
        "Could not regenerate the response. Please try again."
      );

    } finally {
      setRegeneratingMessageIndex(
        null
      );
    }
  };


  // ==========================================
  // ENTER KEY
  // ==========================================

  const handleKeyDown = (
    event
  ) => {
    if (
      event.key === "Enter" &&
      !event.shiftKey
    ) {
      event.preventDefault();

      if (!isLoading) {
        sendMessage();
      }
    }
  };


  // ==========================================
  // IMAGE SELECT
  // ==========================================

  const handleImageSelect = (
    event
  ) => {
    const file =
      event.target.files?.[0];

    if (!file) {
      return;
    }

    if (
      !file.type.startsWith(
        "image/"
      )
    ) {
      alert(
        "Please select a valid image file."
      );

      event.target.value = "";

      return;
    }

    if (
      file.size >
      5 * 1024 * 1024
    ) {
      alert(
        "Please select an image smaller than 5 MB."
      );

      event.target.value = "";

      return;
    }

    setSelectedImage(file);

    const previewUrl =
      URL.createObjectURL(file);

    setImagePreview(previewUrl);
  };


  // ==========================================
  // REMOVE IMAGE
  // ==========================================

  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };


  // ==========================================
  // NEW CHAT
  // ==========================================

  const startNewChat = () => {
    setMessages([]);

    setMessage("");

    setCurrentConversationId(null);

    setCopiedMessageIndex(null);
    setRegeneratingMessageIndex(null);

    removeImage();
  };


  // ==========================================
  // DARK / LIGHT MODE
  // ==========================================

  const toggleTheme = () => {
    setDarkMode(
      (previous) =>
        !previous
    );
  };


  // ==========================================
  // AUTH SCREEN
  // ==========================================

  if (!token) {
    return (
      <div
        className={`app ${darkMode ? "dark-mode" : "light-mode"}`}
      >
        <div
          style={{
            position: "fixed",
            inset: 0,
            width: "100vw",
            minHeight: "100vh",
            boxSizing: "border-box",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            background: darkMode ? "#090909" : "#f5f5f5",
            zIndex: 9999,
            overflowY: "auto",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "420px",
              background: darkMode ? "#151515" : "#ffffff",
              borderRadius: "20px",
              padding: "36px",
              boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
              border: darkMode ? "1px solid #292929" : "1px solid #eeeeee",
            }}
          >
            <div style={{ textAlign: "center", marginBottom: "30px" }}>
              <div
                style={{
                  width: "58px", height: "58px", borderRadius: "16px",
                  margin: "0 auto 14px", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  background: "linear-gradient(135deg, #ff2b2b, #a80000)",
                  color: "white", fontSize: "28px", fontWeight: "700",
                }}
              >
                ✦
              </div>

              <h1 style={{ margin: 0, fontSize: "28px", color: darkMode ? "#fff" : "#111" }}>
                Nova AI
              </h1>

              <p style={{ marginTop: "8px", color: darkMode ? "#aaa" : "#777" }}>
                Your intelligent AI assistant
              </p>
            </div>

            <div style={{ display: "flex", gap: "8px", marginBottom: "24px" }}>
              <button type="button" onClick={() => { setAuthMode("login"); setAuthError(""); }} style={authTabStyle(authMode === "login", darkMode)}>
                Login
              </button>
              <button type="button" onClick={() => { setAuthMode("register"); setAuthError(""); }} style={authTabStyle(authMode === "register", darkMode)}>
                Register
              </button>
            </div>

            <form onSubmit={authMode === "login" ? handleLogin : handleRegister}>
              {authMode === "register" && (
                <AuthField label="Name" type="text" value={authName} onChange={setAuthName} placeholder="Enter your name" darkMode={darkMode} />
              )}

              <AuthField label="Email" type="email" value={authEmail} onChange={setAuthEmail} placeholder="you@example.com" darkMode={darkMode} />
              <AuthField label="Password" type="password" value={authPassword} onChange={setAuthPassword} placeholder="Enter your password" darkMode={darkMode} />

              {authError && (
                <div
                  style={{
                    padding: "11px 13px", marginBottom: "16px", borderRadius: "9px",
                    background: darkMode ? "#351010" : "#fff0f0",
                    color: "#d00000", fontSize: "14px",
                  }}
                >
                  {authError}
                </div>
              )}

              <button
                type="submit"
                disabled={authLoading}
                style={{
                  width: "100%", padding: "13px", border: "none", borderRadius: "10px",
                  background: authLoading ? "#777" : "#e50909", color: "#fff",
                  fontSize: "15px", fontWeight: "700",
                  cursor: authLoading ? "not-allowed" : "pointer",
                }}
              >
                {authLoading ? "Please wait..." : authMode === "login" ? "Login to Nova AI" : "Create Account"}
              </button>
            </form>

            <button
              type="button"
              onClick={toggleTheme}
              style={{
                width: "100%", marginTop: "18px", padding: "10px", border: "none",
                background: "transparent", color: darkMode ? "#bbb" : "#666", cursor: "pointer",
              }}
            >
              {darkMode ? "🌙 Dark Mode" : "☀️ Light Mode"}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // UI
  // ==========================================

  return (
    <div
      className={`app ${
        darkMode
          ? "dark-mode"
          : "light-mode"
      }`}
    >

      {/* =====================================
          SIDEBAR
      ====================================== */}

      <aside className="sidebar">

        {/* BRAND */}

        <div className="brand">

          <div className="brand-icon">
            ✦
          </div>

          <span>
            Nova AI
          </span>

        </div>


        {/* NEW CHAT */}

        <button
          className="new-chat-btn"
          onClick={startNewChat}
        >
          <span>
            ＋
          </span>

          New Chat
        </button>


        {/* RECENT CHATS */}

        <div className="sidebar-section">

          <p className="section-title">
            Recent Chats
          </p>

          {/* SEARCH CONVERSATIONS */}

          <div className="conversation-search">
            <span>🔎</span>

            <input
              type="text"
              placeholder="Search chats..."
              value={conversationSearch}
              onChange={(event) =>
                setConversationSearch(
                  event.target.value
                )
              }
            />
          </div>

          <div className="chat-list">

            {conversations.filter(
              (conversation) =>
                (
                  conversation.title ||
                  "New Conversation"
                )
                  .toLowerCase()
                  .includes(
                    conversationSearch
                      .toLowerCase()
                  )
            ).length === 0 ? (

              <div className="empty-history">
                {conversationSearch.trim()
                  ? "No chats found"
                  : "No conversations yet"}
              </div>

            ) : (

              conversations
                .filter(
                  (conversation) =>
                    (
                      conversation.title ||
                      "New Conversation"
                    )
                      .toLowerCase()
                      .includes(
                        conversationSearch
                          .toLowerCase()
                      )
                )
                .map(
                  (conversation) => (

                    <div
                      key={
                        conversation.id
                      }
                      className={`chat-history-wrapper ${
                        currentConversationId ===
                        conversation.id
                          ? "selected-chat"
                          : ""
                      }`}
                    >

                      {/* CHAT */}

                      <button
                        className="chat-history"
                        onClick={() =>
                          loadConversation(
                            conversation.id
                          )
                        }
                      >

                        <span className="chat-icon">
                          💬
                        </span>

                        <span className="chat-title">
                          {
                            conversation.title ||
                            "New Conversation"
                          }
                        </span>

                      </button>


                      {/* DELETE */}

                      <button
                        className="delete-chat-btn"
                        onClick={(event) => {

                          event.stopPropagation();

                          deleteConversation(
                            conversation.id
                          );

                        }}
                        aria-label="Delete conversation"
                        title="Delete conversation"
                      >
                        🗑️
                      </button>

                    </div>

                  )
                )

            )}

          </div>

        </div>


        {/* SIDEBAR BOTTOM */}

        <div className="sidebar-bottom">

          {/* THEME */}

          <button
            className="sidebar-item theme-toggle"
            onClick={toggleTheme}
          >

            <span>
              {darkMode
                ? "🌙"
                : "☀️"}
            </span>

            <span>
              {darkMode
                ? "Dark Mode"
                : "Light Mode"}
            </span>

          </button>


          {/* USER */}

          <div className="user-profile">

            <div className="avatar">
              {(localStorage.getItem("nova_name") || localStorage.getItem("nova_email") || "U").charAt(0).toUpperCase()}
            </div>

            <div className="user-info">

              <strong>
                {localStorage.getItem("nova_name") || "User"}
              </strong>

              <span>
                {localStorage.getItem("nova_email") || "Personal account"}
              </span>

            </div>

          </div>

          <button
            className="sidebar-item"
            onClick={logout}
            style={{
              cursor: "pointer",
              border: "none",
              width: "100%",
              background: "transparent",
              textAlign: "left",
            }}
          >
            <span>↪</span>
            <span>Logout</span>
          </button>

        </div>

      </aside>


      {/* =====================================
          MAIN CHAT
      ====================================== */}

      <main className="chat-area">

        {/* HEADER */}

        <header className="chat-header">

          <div>

            <h2>
              AI Assistant
            </h2>

            <span className="status">

              <span className="status-dot"></span>

              Online

            </span>

          </div>

        </header>


        {/* CHAT CONTENT */}

        <section className="welcome">

          {messages.length === 0 ? (

            <div className="welcome-content">

              <div className="welcome-icon">
                ✦
              </div>

              <h1>
                How can I help you today?
              </h1>

              <p>
                Ask me anything. I can help you
                learn, create, analyze and solve
                problems.
              </p>


              {/* SUGGESTIONS */}

              <div className="suggestions">

                <button
                  onClick={() =>
                    setMessage(
                      "Explain Java concepts"
                    )
                  }
                >

                  <span>
                    💻
                  </span>

                  Explain Java concepts

                </button>


                <button
                  onClick={() =>
                    setMessage(
                      "Help me study"
                    )
                  }
                >

                  <span>
                    📚
                  </span>

                  Help me study

                </button>


                <button
                  onClick={() =>
                    setMessage(
                      "Brainstorm an idea"
                    )
                  }
                >

                  <span>
                    💡
                  </span>

                  Brainstorm an idea

                </button>


                <button
                  onClick={() =>
                    setMessage(
                      "Help me write something"
                    )
                  }
                >

                  <span>
                    ✍️
                  </span>

                  Help me write something

                </button>

              </div>

            </div>

          ) : (

            <div className="messages-container">

              {messages.map(
                (msg, index) => (

                  <div
                    key={index}
                    className={`message ${
                      msg.sender === "USER"
                        ? "user-message"
                        : "ai-message"
                    }`}
                  >

                    <div className="message-avatar">

                      {msg.sender === "USER"
                        ? "M"
                        : "✦"}

                    </div>


                    <div className="message-content">

                      {/* IMAGE */}

                      {msg.image && (

                        <img
                          src={msg.image}
                          alt="Uploaded"
                          className="message-image"
                        />

                      )}


                      {/* AI MARKDOWN */}

                      {msg.sender ===
                      "AI" ? (

                        <>
                          <ReactMarkdown
                            remarkPlugins={[
                              remarkGfm,
                            ]}
                          >
                            {msg.content}
                          </ReactMarkdown>

                          <div className="ai-response-actions">
                            <button
                              className="copy-response-btn"
                              onClick={() =>
                                copyAIResponse(
                                  msg.content,
                                  index
                                )
                              }
                              type="button"
                              aria-label="Copy AI response"
                              title="Copy response"
                            >
                              {copiedMessageIndex ===
                              index
                                ? "✓ Copied"
                                : "📋 Copy"}
                            </button>

                            {index ===
                              messages.length - 1 && (
                              <button
                                className="regenerate-response-btn"
                                onClick={() =>
                                  regenerateResponse(
                                    index
                                  )
                                }
                                type="button"
                                aria-label="Regenerate AI response"
                                title="Regenerate response"
                                disabled={
                                  regeneratingMessageIndex !==
                                  null
                                }
                              >
                                {regeneratingMessageIndex ===
                                index
                                  ? "⟳ Regenerating..."
                                  : "🔄 Regenerate"}
                              </button>
                            )}
                          </div>
                        </>

                      ) : (

                        <p>
                          {msg.content}
                        </p>

                      )}

                    </div>

                  </div>

                )
              )}


              {/* LOADING */}

              {isLoading && (

                <div className="message ai-message">

                  <div className="message-avatar">
                    ✦
                  </div>

                  <div className="message-content">

                    <span className="thinking">
                      Thinking...
                    </span>

                  </div>

                </div>

              )}

            </div>

          )}

        </section>


        {/* =================================
            INPUT AREA
        ================================== */}

        <div className="input-container">

          {/* IMAGE PREVIEW */}

          {imagePreview && (

            <div className="image-preview-container">

              <img
                src={imagePreview}
                alt="Selected"
                className="image-preview"
              />

              <button
                className="remove-image-btn"
                onClick={
                  removeImage
                }
                aria-label="Remove image"
                type="button"
              >
                ×
              </button>

            </div>

          )}


          <div className="input-box">

            {/* HIDDEN FILE INPUT */}

            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={
                handleImageSelect
              }
              style={{
                display: "none",
              }}
            />


            {/* IMAGE BUTTON */}

            <button
              className="image-upload-btn"
              onClick={() =>
                fileInputRef.current?.click()
              }
              aria-label="Add image"
              title="Add image"
              type="button"
            >
              🖼️
            </button>


            {/* TEXT INPUT */}

            <textarea
              value={message}
              onChange={(event) =>
                setMessage(
                  event.target.value
                )
              }
              onKeyDown={
                handleKeyDown
              }
              placeholder={
                selectedImage
                  ? "Ask me about this image..."
                  : "Message Nova AI..."
              }
              rows="1"
              disabled={isLoading}
            />


            {/* SEND */}

            <button
              className="send-btn"
              onClick={sendMessage}
              aria-label="Send message"
              type="button"
              disabled={isLoading}
            >

              {isLoading
                ? "..."
                : "↑"}

            </button>

          </div>


          <p className="input-note">

            Nova AI can make mistakes.
            Check important information.

          </p>

        </div>

      </main>

    </div>
  );
}

function authTabStyle(active, darkMode) {
  return {
    flex: 1,
    padding: "11px",
    borderRadius: "10px",
    border: "none",
    cursor: "pointer",
    background: active ? "#e50909" : darkMode ? "#242424" : "#eeeeee",
    color: active ? "#ffffff" : darkMode ? "#cccccc" : "#555555",
    fontWeight: "600",
  };
}

function AuthField({ label, type, value, onChange, placeholder, darkMode }) {
  return (
    <div style={{ marginBottom: "16px" }}>
      <label
        style={{
          display: "block",
          marginBottom: "7px",
          fontSize: "14px",
          fontWeight: "600",
          color: darkMode ? "#dddddd" : "#333333",
        }}
      >
        {label}
      </label>

      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        style={{
          width: "100%",
          boxSizing: "border-box",
          padding: "12px 13px",
          borderRadius: "9px",
          border: darkMode ? "1px solid #333333" : "1px solid #dddddd",
          outline: "none",
          background: darkMode ? "#202020" : "#fafafa",
          color: darkMode ? "#ffffff" : "#111111",
          fontSize: "14px",
        }}
      />
    </div>
  );
}

export default App;