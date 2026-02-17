import React, { useState, useEffect, ChangeEvent } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import { useNavigate } from "react-router-dom";
import api from "../../services/api";

interface DateSendProps {
  dateFrom?: string | null;
  dateValue: string;
}

interface MessageProps {
  messageContent: string;
  savedDates: string;
}

interface MessageData {
  messageContent: string;
  messageType: "sent" | "recieved";
  timeStamp: string;
}

function DateSend({ dateFrom, dateValue }: DateSendProps) {
  return (
    <p className={dateFrom != null ? "date-sent-from-me" : "date-sent-from-them"}>
      {dateValue}
    </p>
  );
}

function TheirMessage({ messageContent, savedDates }: MessageProps) {
  const [displayDate, setDisplayDate] = useState(false);
  return (
    <div className="their-message">
      <div className="message-bubbles-from-them" onClick={() => setDisplayDate(!displayDate)}>
        {messageContent}
      </div>
      <div className="date-sent-from-them">
        {displayDate && <DateSend dateValue={savedDates} />}
      </div>
    </div>
  );
}

function MyMessage({ messageContent, savedDates }: MessageProps) {
  const [displayDate, setDisplayDate] = useState(false);
  return (
    <div className="my-message">
      <div className="message-bubbles-from-me" onClick={() => setDisplayDate(!displayDate)}>
        {messageContent}
      </div>
      <div className="date-sent-from-me">
        {displayDate && <DateSend dateFrom="me" dateValue={savedDates} />}
      </div>
    </div>
  );
}

function NewChatWindow() {
  const navigate = useNavigate();
  const username = sessionStorage.getItem('for-username');

  // FIX 1: Parse the token consistently — strip JSON quotes if stored as JSON string
  const rawUserToken = sessionStorage.getItem('fetchUserMessage');
  const userToken = rawUserToken
    ? rawUserToken.replace(/^"|"$/g, '')  // strip surrounding quotes if any
    : null;

  const [inputContent, setInputContent] = useState("");
  const [messages, setMessages] = useState<MessageData[]>([]);
  const [error, setError] = useState<string | null>(null); // FIX 2: track fetch errors

  const url = import.meta.env.VITE_API_URL;

  const fetchMessage = async (token: string | null) => {
    if (!token) {
      console.error("userToken is missing");
      return;
    }
    try {
      const response = await api.get(
        `${url}/searchConversation?personConvoWithToken=${token}`
      );
      // FIX 3: The backend returns { messages: [...] } — guard both null and missing
      setMessages(response.data?.messages ?? []);
      setError(null);
    } catch (error: any) {
      // FIX 4: A 404 means no conversation exists yet — show empty chat, not an error
      if (error?.response?.status === 404) {
        setMessages([]);
      } else {
        console.error("Failed to fetch message list:", error);
        setError("Could not load messages.");
      }
    }
  };

  const handleBackResetItems = () => {
    navigate("/admin");
    sessionStorage.removeItem('for-username');
    sessionStorage.removeItem('fetchUserMessage');
    sessionStorage.removeItem('fetchAdminMessage');
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setInputContent(event.target.value);
  };

  const addMessage = async (messContent: string) => {
    if (!messContent.trim()) return; // FIX 5: don't send empty messages

    const adminTokenRaw = sessionStorage.getItem("adminToken");
    // FIX 6: Parse consistently — JSON.parse handles both '"token"' and plain 'token'
    let adminToken: string | null = null;
    try {
      adminToken = adminTokenRaw ? JSON.parse(adminTokenRaw) : null;
    } catch {
      adminToken = adminTokenRaw; // fallback if stored as plain string
    }

    if (!adminToken || !userToken) {
      alert("Missing tokens. Please login again.");
      return;
    }

    const isoTimestamp = new Date().toISOString();
    try {
      const requestBody = {
        messageContent: messContent,
        messageType: "recieved", // admin sending = "recieved" by convention in your system
        timeStamp: isoTimestamp,
      };

      await api.post(
        `${url}/addMessageToPerson?adminToken=${adminToken}&personToken=${userToken}`,
        requestBody
      );

      setInputContent("");
      fetchMessage(userToken); // refresh messages after send
    } catch (error) {
      console.error("Failed to add message:", error);
    }
  };

  useEffect(() => {
    const adminTokenRaw = sessionStorage.getItem("adminToken");
    if (!adminTokenRaw) {
      navigate("/");
      return;
    }
    fetchMessage(userToken);
  }, []);

  return (
    <div className="chatBody">
      <div className="new-chat-window">
        <div className="new-back-container">
          <button onClick={handleBackResetItems}>
            <FontAwesomeIcon icon={faArrowLeft} color="white" />
          </button>
        </div>
        <header>
          <div className="new-profile-pic"></div>
          <h3 className="new-profile-name">{username || "Unknown User"}</h3>
        </header>

        <main className="new-chat-main-body">
          <div className="new-message-container">
            {error && <p style={{ color: 'red', textAlign: 'center' }}>{error}</p>}
            {messages.map((message, index) => {
              const savedDates = new Date(message.timeStamp).toLocaleDateString();
              return message.messageType === "recieved" ? (
                <MyMessage key={index} messageContent={message.messageContent} savedDates={savedDates} />
              ) : (
                <TheirMessage key={index} messageContent={message.messageContent} savedDates={savedDates} />
              );
            })}
          </div>
        </main>

        <footer className="new-message-input-box">
          <input
            type="text"
            placeholder="Type a message"
            value={inputContent}
            onChange={handleChange}
            onKeyDown={(e) => e.key === 'Enter' && addMessage(inputContent)} // FIX 7: Enter key support
          />
          <button onClick={() => addMessage(inputContent)}>
            <FontAwesomeIcon icon={faArrowUp} />
          </button>
        </footer>
      </div>
    </div>
  );
}

export default NewChatWindow;