import React, { useEffect, useState } from "react";

// 1. Define the shape of a User object
interface User {
  name: string;
  email: string;
  message: string;
}

function UserList() {
  // 2. Tell useState that this is an array of User objects
  const [users, setUsers] = useState<User[]>([]);

  // Uncomment and use useEffect to actually fetch data
  /*
  useEffect(() => {
    fetch("http://localhost:8080/fetchAll")
       .then((response) => response.json())
       .then((data) => setUsers(data))
       .catch((error) => console.error("Error fetching data:", error));
  }, []);
  */
    
  return (
    <div>
      <h1>User List</h1>
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
    </div>
  );
}

export default UserList;