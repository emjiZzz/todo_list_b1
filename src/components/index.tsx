import React, { useState } from 'react';

// Define the "Todo" type outside of the component.
type Todo = {
  title: string;
  readonly id: number;
  completed_flg: boolean;
  delete_flg: boolean; // <-- Add
};

// Define the Todo component.
const Todos: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]); // State to hold the array of Todos.
  const [text, setText] = useState(''); // State for form input.
  const [nextId, setNextId] = useState(1); // State to hold the ID of the next Todo.

  // Function to update todos state
  const handleSubmit = () => {
    // Return if nothing has been entered
    if (!text) return;

    // Create a new Todo
    const newTodo: Todo = {
      title: text, // Set the value of the text state to the title property
      id: nextId,
      // Initial value is false
      completed_flg: false,
      delete_flg: false, // <-- Add
    };

    /**
     * Based on the todos state before the update
     * To elements expanded with spread syntax
     * Update the state with the new array containing newTodo
     **/
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

      // Check if the todos state has been changed.
      // This console.log section was for debugging and can technically be removed,
      // but is kept here as per the request to not modify the provided complete code.
      console.log('=== Original todos ===');
      todos.map((todo) => {
        console.log(`id: ${todo.id}, title: ${todo.title}`);
      });

      return newTodos;
    });
  };

  const handleCheck = (id: number, completed_flg: boolean) => {
    setTodos((todos) => {
      const newTodos = todos.map((todo) => {
        if (todo.id === id) {
          return { ...todo, completed_flg };
        }
        return todo;
      });
      return newTodos;
    });
  };

  const handleRemove = (id: number, delete_flg: boolean) => {
    setTodos((todos) => {
      const newTodos = todos.map((todo) => {
        if (todo.id === id) {
          return { ...todo, delete_flg };
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
          placeholder="Enter your task" // Added placeholder for better UX based on previous example
        />
        <button className="insert-btn" type="submit">
          追加
        </button>{/* Clicking the button does not trigger onSubmit */}
      </form>
      <ul>
        {todos.map((todo) => {
          return (
            <li key={todo.id}>
              <input
                type="checkbox"
                checked={todo.completed_flg} // Toggle the checked flag on the caller.
                onChange={() => handleCheck(todo.id, !todo.completed_flg)}
              />
              <input
                type="text"
                value={todo.title}
                disabled={todo.completed_flg}
                onChange={(e) => handleEdit(todo.id, e.target.value)}
              />
              <button onClick={() => handleRemove(todo.id, !todo.delete_flg)}>
                {todo.delete_flg ? 'Restore' : 'Delete'}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

export default Todos;