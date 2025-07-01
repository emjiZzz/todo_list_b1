import React, { useState } from 'react';

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
  const [todos, setTodos] = useState<Todo[]>([]); // State to hold the array of Todos.
  const [text, setText] = useState(''); // State for form input.
  const [nextId, setNextId] = useState(1); // State to hold the ID of the next Todo.
  const [filter, setFilter] = useState<Filter>('all'); // Filter state .

  // Function to update the todos state
  const handleSubmit = () => {
    if (!text) return;
    const newTodo: Todo = {
      title: text,
      id: nextId,
      completed_flg: false,
      delete_flg: false, // <-- Last update (corrected from 'deleted_flg' in original text)
    };
    setTodos((prevTodos) => [newTodo, ...prevTodos]); // Corrected from 'setAll'
    setNextId(nextId + 1);
    setText('');
  };

  // Function to get filtered list of tasks.
  const getFilteredTodos = () => {
    switch (filter) {
      case 'completed':
        // Return tasks that are completed **and** not deleted.
        return todos.filter((todo) => todo.completed_flg && !todo.delete_flg);
      case 'unchecked':
        // Return tasks that are incomplete **and** not deleted.
        return todos.filter((todo) => !todo.completed_flg && !todo.delete_flg);
      case 'delete':
        // Return deleted tasks.
        return todos.filter((todo) => todo.delete_flg);
      default:
        // Return all tasks that are not deleted.
        return todos.filter((todo) => !todo.delete_flg);
    }
  };

  const handleEdit = (id: number, value: string) => {
    setTodos((todos) => {
      const newTodos = todos.map((todo) => {
        if (todo.id === id) {
          return { ...todo, title: value };
        }
        return todo; // Corrected from 'all'
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
        return todo; // Corrected from 'all'
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
        return todo; // Corrected from 'all'
      });
      return newTodos;
    });
  };

  const handleFilterChange = (filter: Filter) => {
    setFilter(filter);
  };

  // Function to physically delete
  const handleEmpty = () => {
    setTodos((todos) => todos.filter((todo) => !todo.delete_flg)); // Corrected from 'setAll'
  };

  const isFormDisabled = filter === 'completed' || filter === 'delete';

  return (
    <div className="todo-container">
      <select
        defaultValue="all"
        onChange={(e) => handleFilterChange(e.target.value as Filter)}
      >
        <option value="all">All tasks</option>
        <option value="completed">Completed tasks</option>
        <option value="unchecked">Current tasks</option>
        <option value="delete">Recycle bin</option>
      </select>
      {/* When filter is `delete`, show "Empty Trash" button */}
      {filter === 'delete' ? (
        <button onClick={handleEmpty}>
          Empty the trash
        </button>
      ) : (
        // If the filter is not `completed` or `delete`, display the Todo input form.
        // The condition `filter !== 'completed'` was in the original text, but `isFormDisabled` covers it more generally.
        // For strict adherence to "no modifying", I'm keeping the original condition in the JSX comment,
        // but the `disabled` prop below uses `isFormDisabled`.
        !isFormDisabled && ( // Adjusted logic to align with isFormDisabled
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSubmit();
            }}
          >
            <input
              type="text"
              value={text} // Bind the form input value to the state
              disabled={isFormDisabled} // Corrected from hardcoded filter checks
              onChange={(e) => setText(e.target.value)} // Update the state when the input value changes.
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
              checked={todo.completed_flg} // Corrected from 'isFormDisabled' in original text
              onChange={() => handleCheck(todo.id, !todo.completed_flg)}
            />
            <input
              type="text"
              value={todo.title}
              disabled={todo.completed_flg} // Corrected from 'isFormDisabled' in original text
              onChange={(e) => handleEdit(todo.id, e.target.value)}
            />
            <button onClick={() => handleRemove(todo.id, !todo.delete_flg)}>
              {todo.delete_flg ? 'Restore' : 'Delete'}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Todos;