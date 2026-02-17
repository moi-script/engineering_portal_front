import React, { useState } from "react";
import axios from "axios";

// 1. Define the interface for your User data
interface UserData {
  name: string;
  email: string;
  message: string;
}

const FetchData = () => {
  const apiUrl = import.meta.env.VITE_API_URL;
  console.log("this is the api", apiUrl);

  // 2. Type the state as an array of UserData
  const [users, setUsers] = useState<UserData[]>([]); 
  const [showUser, setShowUser] = useState(false); 

  const handleShow = async () => {
    if (!showUser) {
      try {
        // 3. (Optional) You can also type the axios response
        const response = await axios.get<UserData[]>(`${apiUrl}/fetchAll`);
        setUsers(response.data);
        setShowUser(true); 
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    } else {
      setShowUser(false); 
    }
  };

  return (
    <div>
      <button onClick={handleShow}>
        {showUser ? "Hide Data" : "Fetch Data"}
      </button>

      <h1>User List</h1>
      {showUser && users.length > 0 ? (
        <ul>
          {users.map((user, index) => (
            <li key={index}>
              <strong>Name:</strong> {user.name}
              <br />
              <strong>Email:</strong> {user.email}
              <br />
              <strong>Message:</strong> {user.message}
            </li>
          ))}
        </ul>
      ) : showUser ? (
        <p>No data available.</p>
      ) : null}
    </div>
  );
};

export default FetchData;