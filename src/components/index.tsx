import React, { useState } from 'react';

// Define the "Todo" type outside the component.
type Todo = {
  title: string; // The title property is of type string
  readonly id: number;
};

// Define the Todo component.
const Todos: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]); // State to hold the array of Todos
  const [text, setText] = useState(''); // State for form input
  const [nextId, setNextId] = useState(1); // State that holds the ID of the next Todo

  // Function to update todos state
  const handleSubmit = () => {
    // Return if nothing has been entered
    if (!text) return;

    // Create a new Todo
    const newTodo: Todo = {
      title: text, // Set the value of the text state to the content property
      id: nextId,
    };

    setTodos((prevTodos) => [newTodo, ...prevTodos]);
    setNextId(nextId + 1); // Update the next ID

    // Clear form input
    setText('');
  };

  const handleEdit = (id: number, value: string) => {
    setTodos((todos) => {
      const newTodos = todos.map((todo) => {
        if (todo.id === id) {
          // Create a new object and return it
          return { ...todo, title: value };
        }
        return todo;
      });
      return newTodos;
    });
  };

  return (
    <div>
      <form
        onSubmit={(e) => {
          e.preventDefault(); // Prevent the form's default behavior
          handleSubmit(); // Call the handleSubmit function
        }}
      >
        <input
          type="text"
          value={text} // Bind the form input value to the state
          onChange={(e) => setText(e.target.value)} // Update the state when the input value changes.
          placeholder="Enter your task"
        />
        <button className="insert-btn" type="submit">
          追加
        </button>
      </form>
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <input
              type="text"
              value={todo.title}
              onChange={(e) => handleEdit(todo.id, e.target.value)}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Todos;