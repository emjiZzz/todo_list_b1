// src/components/Top.tsx
import React from "react";
import { useNavigate } from "react-router-dom";

const Top: React.FC = () => {
  const navigate = useNavigate();

  const goToTodos = () => {
    navigate("/todos");
  };

  return (
    <div>
      <h1>Welcome to My Todo App</h1>
      <p>This is the homepage of our todo application.</p>
      <button onClick={goToTodos}>Go to Todo List</button>
    </div>
  );
};

export default Top;