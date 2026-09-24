import { useState } from "react";
import "./App.css";

function App() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  const sendMessage = async () => {
  if (!message.trim()) return;

  const userMessage = {
    sender: "USER",
    content: message,
  };

  setMessages((previous) => [...previous, userMessage]);

  const currentMessage = message;
  setMessage("");

  try {
    const response = await fetch(
      "http://localhost:8080/api/chat",
      {
        method: "POST",
        headers: {
          "Content-Type": "text/plain",
        },
        body: currentMessage,
      }
    );

    if (!response.ok) {
      throw new Error("Failed to get AI response");
    }

    const data = await response.json();

    const aiMessage = {
      sender: "AI",
      content: data.content,
    };

    setMessages((previous) => [...previous, aiMessage]);

  } catch (error) {
    console.error(error);

    const errorMessage = {
      sender: "AI",
      content: "Sorry, something went wrong. Please try again.",
    };

    setMessages((previous) => [...previous, errorMessage]);
  }
};
  const handleKeyDown = (event) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="app">

      {/* Sidebar */}
      <aside className="sidebar">

        <div className="brand">
          <div className="brand-icon">✦</div>
          <span>Nova AI</span>
        </div>

        <button className="new-chat-btn">
          <span>＋</span>
          New Chat
        </button>

        <div className="sidebar-section">
          <p className="section-title">Recent chats</p>

          <div className="chat-history active">
            <span>💬</span>
            Java polymorphism
          </div>

          <div className="chat-history">
            <span>💬</span>
            History of Cleopatra
          </div>

          <div className="chat-history">
            <span>💬</span>
            Spring Boot basics
          </div>
        </div>

        <div className="sidebar-bottom">

          <div className="sidebar-item">
            ⚙️ Settings
          </div>

          <div className="user-profile">
            <div className="avatar">M</div>

            <div>
              <strong>Mouna</strong>
              <span>Personal account</span>
            </div>
          </div>

        </div>

      </aside>


      {/* Main Chat Area */}
      <main className="chat-area">

        <header className="chat-header">

          <div>
            <h2>AI Assistant</h2>

            <span className="status">
              <span className="status-dot"></span>
              Online
            </span>
          </div>

          <button className="menu-btn">
            •••
          </button>

        </header>


        {/* Messages */}
        <section className="welcome">

          {messages.length === 0 ? (

            <>
              <div className="welcome-icon">
                ✦
              </div>

              <h1>How can I help you today?</h1>

              <p>
                Ask me anything. I can help you learn, create,
                analyze and solve problems.
              </p>

              <div className="suggestions">

                <button
                  onClick={() =>
                    setMessage("Explain Java concepts")
                  }
                >
                  <span>💻</span>
                  Explain Java concepts
                </button>

                <button
                  onClick={() =>
                    setMessage("Help me study")
                  }
                >
                  <span>📚</span>
                  Help me study
                </button>

                <button
                  onClick={() =>
                    setMessage("Brainstorm an idea")
                  }
                >
                  <span>💡</span>
                  Brainstorm an idea
                </button>

                <button
                  onClick={() =>
                    setMessage("Help me write something")
                  }
                >
                  <span>✍️</span>
                  Help me write something
                </button>

              </div>
            </>

          ) : (

            <div className="messages-container">

              {messages.map((msg, index) => (

                <div
                  key={index}
                  className={`message ${
                    msg.sender === "USER"
                      ? "user-message"
                      : "ai-message"
                  }`}
                >

                  <div className="message-avatar">
                    {msg.sender === "USER" ? "M" : "✦"}
                  </div>

                  <div className="message-content">
                    {msg.content}
                  </div>

                </div>

              ))}

            </div>

          )}

        </section>


        {/* Input */}
        <div className="input-container">

          <div className="input-box">

            <textarea
              value={message}
              onChange={(event) =>
                setMessage(event.target.value)
              }
              onKeyDown={handleKeyDown}
              placeholder="Message Nova AI..."
              rows="1"
            />

            <button
              className="send-btn"
              onClick={sendMessage}
            >
              ↑
            </button>

          </div>

          <p className="input-note">
            Nova AI can make mistakes. Check important information.
          </p>

        </div>

      </main>

    </div>
  );
}

export default App;