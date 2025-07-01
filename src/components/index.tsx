import React, { useState, useEffect } from 'react';
import localforage from 'localforage';
import { useNavigate } from 'react-router-dom';

// Define the "Todo" type outside of the component.
type Todo = {
  title: string;
  readonly id: number;
  completed_flg: boolean;
  delete_flg: boolean;
};

type Filter = 'all' | 'completed' | 'unchecked' | 'delete';

// Define the Todo component.
const Todos: React.FC = () => {
  // Added from your snippet:
  const navigate = useNavigate(); // This line assumes 'useNavigate' is imported from 'react-router-dom' in your environment.

  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState('');
  const [nextId, setNextId] = useState(1);
  const [filter, setFilter] = useState<Filter>('all');

  useEffect(() => {
    console.log('Loading todos from localforage...');
    localforage.getItem('todo-20240622')
      .then((values) => {
        if (values) {
          setTodos(values as Todo[]);
          const maxId = (values as Todo[]).reduce((max, todo) => Math.max(max, todo.id), 0);
          setNextId(maxId + 1);
        }
      })
      .catch((err) => {
        console.error("Error loading todos from localforage:", err);
      });
  }, []);

  useEffect(() => {
    console.log('Saving todos to localforage:', todos);
    localforage.setItem('todo-20240622', todos)
      .catch((err) => {
        console.error("Error saving todos to localforage:", err);
      });
  }, [todos]);

  const handleSubmit = () => {
    if (!text.trim()) {
      console.log('Cannot add an empty task');
      return;
    }

    const newTodo: Todo = {
      title: text,
      id: nextId,
      completed_flg: false,
      delete_flg: false,
    };

    setTodos((prevTodos) => [newTodo, ...prevTodos]);
    setNextId(nextId + 1);
    setText('');
  };

  const getFilteredTodos = () => {
    switch (filter) {
      case 'completed':
        return todos.filter((todo) => todo.completed_flg && !todo.delete_flg);
      case 'unchecked':
        return todos.filter((todo) => !todo.completed_flg && !todo.delete_flg);
      case 'delete':
        return todos.filter((todo) => todo.delete_flg);
      default:
        return todos.filter((todo) => !todo.delete_flg);
    }
  };

  const handleTodo = <K extends keyof Todo, V extends Todo[K]>(
    id: number,
    key: K,
    value: V
  ) => {
    setTodos((prevTodos) => {
      const newTodos = prevTodos.map((todo) => {
        if (todo.id === id) {
          return { ...todo, [key]: value };
        } else {
          return todo;
        }
      });
      return newTodos;
    });
  };

  const handleEmpty = () => {
    setTodos((prevTodos) => prevTodos.filter((todo) => !todo.delete_flg));
  };

  const handleFilterChange = (selectedFilter: Filter) => {
    setFilter(selectedFilter);
  };

  const isFormDisabled = filter === 'completed' || filter === 'delete';

  return (
    <div className="todo-container">
      {/* Added from your snippet: */}
      <button
        className="back-button"
        onClick={() => navigate('/')}
        title="Back to Top Page"
      >
        &larr; Back
      </button>

      <select
        defaultValue="all"
        onChange={(e) => handleFilterChange(e.target.value as Filter)}
      >
        <option value="all">All tasks</option>
        <option value="completed">Completed tasks</option>
        <option value="unchecked">Current tasks</option>
        <option value="delete">Recycle bin</option>
      </select>

      {filter === 'delete' ? (
        <button className="insert-btn" onClick={handleEmpty}>
          Empty the trash
        </button>
      ) : (
        !isFormDisabled && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <input
              type="text"
              value={text}
              disabled={isFormDisabled}
              onChange={(e) => setText(e.target.value)}
              placeholder="Enter your task"
            />
            <button className="insert-btn" type="submit" disabled={isFormDisabled}>
              追加
            </button>
          </form>
        )
      )}

      <ul>
        {getFilteredTodos().map((todo) => (
          <li key={todo.id}>
            <input
              type="checkbox"
              disabled={todo.delete_flg}
              checked={todo.completed_flg}
              onChange={() => handleTodo(todo.id, 'completed_flg', !todo.completed_flg)}
            />
            <input
              type="text"
              disabled={todo.completed_flg || todo.delete_flg}
              value={todo.title}
              onChange={(e) => handleTodo(todo.id, 'title', e.target.value)}
            />
            <button onClick={() => handleTodo(todo.id, 'delete_flg', !todo.delete_flg)}>
              {todo.delete_flg ? 'Restore' : 'Delete'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Todos;
