import React, { useState, useEffect } from 'react';
import localforage from 'localforage';
import { useNavigate } from 'react-router-dom'; // Import useNavigate for routing

// Define the "Todo" type outside of the component.
type Todo = {
  title: string;
  readonly id: number;
  completed_flg: boolean;
  delete_flg: boolean;
};

type Filter = 'all' | 'completed' | 'unchecked' | 'delete';

// Define the Todo component
const Todo: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]); // State to hold the array of Todos.
  const [text, setText] = useState(''); // State for form input.
  const [nextId, setNextId] = useState(1); // State to hold the ID of the next Todo.
  const [filter, setFilter] = useState<Filter>('all'); // Filter state.

  const navigate = useNavigate(); // Get the navigation function

  // useEffect Hook for initial logging (can be removed in production)
  useEffect(() => {
    // Write side effect here
    console.log('TODO!');
  }, []); // Runs once on mount

  // Function to update the todos state (add new todo)
  const handleSubmit = () => {
    if (!text) return; // Prevent adding empty todos
    const newTodo: Todo = {
      title: text,
      id: nextId,
      completed_flg: false,
      delete_flg: false,
    };
    setTodos((prevTodos) => [newTodo, ...prevTodos]); // Add new todo to the beginning of the list
    setNextId(nextId + 1); // Increment ID for the next todo
    setText(''); // Clear the input field
  };

  // Function to get filtered list of tasks.
  const getFilteredTodos = () => {
    switch (filter) {
      case 'completed':
        // Return tasks that are completed AND not deleted.
        return todos.filter((todo) => todo.completed_flg && !todo.delete_flg);
      case 'unchecked':
        // Return tasks that are incomplete AND not deleted.
        return todos.filter((todo) => !todo.completed_flg && !todo.delete_flg);
      case 'delete':
        // Return deleted tasks.
        return todos.filter((todo) => todo.delete_flg);
      default:
        // Return all tasks that are not deleted.
        return todos.filter((todo) => !todo.delete_flg);
    }
  };

  // Generic function to handle updates to a Todo item's properties
  // This replaces handleEdit, handleCheck, and handleRemove
  const handleTodo = <K extends keyof Todo, V extends Todo[K]>(
    id: number,
    key: K,
    value: V
  ) => {
    setTodos((todos) => {
      const newTodos = todos.map((todo) => {
        if (todo.id === id) {
          return { ...todo, [key]: value };
        } else {
          return todo;
        }
      });
      return newTodos;
    });
  };

  const handleFilterChange = (selectedFilter: Filter) => {
    setFilter(selectedFilter);
  };

  // Function to physically delete tasks (empty trash)
  const handleEmpty = () => {
    setTodos((todos) => todos.filter((todo) => !todo.delete_flg));
  };

  // Use the useEffect hook to get data when the component mounts
  useEffect(() => {
    localforage.getItem('todo-20240622').then((values) => {
      if (values) {
        setTodos(values as Todo[]);
        // Find the maximum ID from loaded todos to ensure nextId is unique
        const maxId = Math.max(...(values as Todo[]).map(todo => todo.id), 0);
        setNextId(maxId + 1);
      }
    }).catch(err => {
      console.error("Error loading todos from localforage:", err);
    });
  }, []); // Empty dependency array means this runs once on mount.

  // Use the useEffect hook to save data every time the todos state is updated.
  useEffect(() => {
    localforage.setItem('todo-20240622', todos).catch(err => {
      console.error("Error saving todos to localforage:", err);
    });
  }, [todos]); // Runs whenever 'todos' state changes.

  // Determine if the form (input and add button) should be disabled
  const isFormDisabled = filter === 'completed' || filter === 'delete';

  return (
    <div className="todo-container">
      <button
        className="back-button"
        onClick={() => navigate('/')}
        title="Back to Top Page"
      >
        ← Back
      </button>
      <select
        defaultValue="all"
        onChange={(e) => handleFilterChange(e.target.value as Filter)}
      >
        <option value="all">All tasks</option>
        <option value="completed">Completed tasks</option>
        <option value="unchecked">Current tasks</option>
        <option value="delete">Trash</option>
      </select>

      {/* Show "Empty Trash" button when filter is `delete` */}
      {filter === 'delete' ? (
        <button className="empty-trash-btn" onClick={handleEmpty}>
          Empty Trash
        </button>
      ) : (
        // Show Todo input form if filter is not `completed`
        filter !== 'completed' && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <input
              type="text"
              value={text} // Bind form input value to state
              disabled={isFormDisabled} // Disable if form is disabled by filter
              onChange={(e) => setText(e.target.value)} // Update state when input value changes
              placeholder="Add a new todo..."
            />
            <button className="insert-btn" type="submit" disabled={isFormDisabled}>
              Add
            </button>
          </form>
        )
      )}

      <ul>
        {getFilteredTodos().map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              disabled={todo.delete_flg} // Checkbox disabled if task is in trash
              checked={todo.completed_flg}
              onChange={() => handleTodo(todo.id, 'completed_flg', !todo.completed_flg)}
            />
            <input
              type="text"
              value={todo.title}
              disabled={todo.completed_flg || todo.delete_flg} // Text input disabled if completed or in trash
              onChange={(e) => handleTodo(todo.id, 'title', e.target.value)}
            />
            <button
              className={todo.delete_flg ? 'restore-btn' : 'delete-btn'}
              onClick={() => handleTodo(todo.id, 'delete_flg', !todo.delete_flg)}
            >
              {todo.delete_flg ? 'Restore' : 'Delete'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Todo;