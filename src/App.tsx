import React, { createContext } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";

// Context & Providers
import { UserProvider } from "./context/UserContext";

// Entry Components
import Login from "./components/log/LoginForm";
import User from "./components/home/User.tsx";
import Materials from "./components/home/Materials.tsx";
import Choices from "./components/home/Questions.tsx";
import ChatWindow from "./components/home/ChatWindow";
import AdminHome from "./components/Admin/Admin_Home";
import StudentList from "./components/Admin/StudentList";
import UploadLesson from "./components/Admin/UploadLessons";
import UploadQuiz from "./components/Admin/UploadQuiz";
import NewChatWindow from "./components/Admin/AdminContact";

// CSS Files (Order is important for Tailwind v4)
import "./App.css";
import "./index.css";

// Global App Context
export const AppContext = createContext<any>(null);

function App() {
  return (
    <UserProvider>
      {/* min-h-screen ensures your Stone/Slate background covers the whole page */}
      <div className="App min-h-screen w-full bg-background">
        <Router basename="/">
          <Routes>
            {/* Auth Route */}
            <Route path="/" element={<Login />} />

            {/* Student/User Routes */}
            <Route path="/user" element={<User />} />
            <Route path="/materials" element={<Materials />} />
            <Route path="/choices" element={<Choices />} />
            <Route path="/contacts" element={<ChatWindow />} />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminHome />} />
            <Route path="/studentList" element={<StudentList />} />
            <Route path="/uploadLessons" element={<UploadLesson />} />
            <Route path="/uploadQuiz" element={<UploadQuiz />} />
            <Route path="/chatfromAdmin" element={<NewChatWindow/>} />
          </Routes>
        </Router>
      </div>
    </UserProvider>
  );
}

export default App;