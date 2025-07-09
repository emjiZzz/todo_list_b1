//tasks detail screen

import React, { useState, useEffect } from 'react';
import localforage from 'localforage';
import { format } from 'date-fns'; // date formatting utility
import { useLocation, useNavigate } from 'react-router-dom'; // Import useNavigate for routing / location
import '../index.css'; // reroute

// Define the "Todo" type of the component
// extended with new fields for task management
export type Todo = {
  title: string;
  readonly id: number;
  completed_flg: boolean;
  delete_flg: boolean;
  progress_rate: number; // completion percentage (0-100)
  start_date: string; // task start date (e.g., 'YYYY-MM-DD')
  scheduled_completion_date: string; // target completion date (e.g., 'YYYY-MM-DD')
  improvements: string; // detailed notes and improvements
};

type Filter = 'all' | 'completed' | 'unchecked' | 'delete';

// Utility function to check if a Date object is valid
const isValidDate = (date: Date): boolean => {
  return !isNaN(date.getTime());
};

// extract URL query parameters for date navigation
function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// Define the Todo component
const Todos: React.FC = () => {
  const query = useQuery();
  const queryDate = query.get('date');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState('');
  const [nextId, setNextId] = useState(1);
  const [filter, setFilter] = useState<Filter>('all');

  // handle date from URL or default to today
  const [currentDate, setCurrentDate] = useState<Date>(() => {
    if (queryDate) {
      const [y, m, d] = queryDate.split('-').map(Number);
      // Validate year, month, day to ensure they are numbers
      if (!isNaN(y) && !isNaN(m) && !isNaN(d)) {
        const parsedDate = new Date(y, m - 1, d);
        if (isValidDate(parsedDate)) {
          return parsedDate;
        }
      }
    }
    // set the initial date to the current day if queryDate is invalid or not present
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });

  // track which accordion is open (only one at a time)
  const [openAccordionId, setOpenAccordionId] = useState<number | null>(null);

  const navigate = useNavigate();

  // load todos and filter state on mount
  useEffect(() => {
    localforage.getItem('todo-20240703').then((values) => {
      if (values) {
        setTodos(values as Todo[]);
        // ensure nextId doesn't conflict with existing todos
        const maxId = Math.max(...(values as Todo[]).map(todo => todo.id), 0);
        setNextId(maxId + 1);
      }
    });
    // remember filter selection between sessions
    localforage.getItem('filterState-20240703').then((value) => {
      if (value) setFilter(value as Filter);
    });
  }, []);

  // save todos whenever they change
  useEffect(() => {
    localforage.setItem('todo-20240703', todos);
  }, [todos]);

  // save filter state whenever it changes
  useEffect(() => {
    localforage.setItem('filterState-20240703', filter);
  }, [filter]);

  // create new todo with validation
  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      alert("Task cannot be empty.");
      return;
    }
    // Initialize dates to empty strings as per Todo type,
    // but ensure they are handled safely later.
    const newTodo: Todo = {
      title: trimmed,
      id: nextId,
      completed_flg: false,
      delete_flg: false,
      progress_rate: 0,
      start_date: '', // Will be updated by user input
      scheduled_completion_date: '', // Will be updated by user input
      improvements: '',
    };
    // keep todos sorted by ID
    setTodos(prev => [...prev, newTodo].sort((a, b) => a.id - b.id));
    setNextId(nextId + 1);
    setText('');
  };

  // Date validation function
  const validateDates = (startDateStr: string, completionDateStr: string) => {
    // Only attempt to create Date objects if both strings are non-empty
    if (!startDateStr || !completionDateStr) {
      return true; // Or false, depending on your desired default validation for empty fields
      // Assuming empty dates are 'valid' for initial state,
      // but actual date comparison requires both to be set.
    }
    const start = new Date(startDateStr);
    const completion = new Date(completionDateStr);

    // Ensure both dates are valid before comparison
    if (!isValidDate(start) || !isValidDate(completion)) {
      console.warn("Attempted to validate dates with invalid string inputs:", startDateStr, completionDateStr);
      return false; // Treat invalid date strings as a validation failure
    }
    return start.getTime() <= completion.getTime(); // Use getTime() for reliable comparison
  };

  // Function to get the next day date string
  const getNextDayDate = (dateString: string) => {
    if (!dateString) {
      // If the input date string is empty, return an empty string or handle as appropriate
      // Returning empty string to avoid creating an invalid date from new Date('')
      return '';
    }
    const date = new Date(dateString);
    if (!isValidDate(date)) {
      console.error("Invalid date string provided to getNextDayDate:", dateString);
      return ''; // Return empty string if the provided date string is invalid
    }
    date.setDate(date.getDate() + 1);
    return format(date, 'yyyy-MM-dd');
  };

  // Generic function to handle updates to a Todo item's properties
  const handleTodo = <K extends keyof Todo, V extends Todo[K]>(id: number, key: K, value: V) => {
    setTodos((todos) =>
      todos.map((todo) => {
        if (todo.id !== id) return todo;
        let updated = { ...todo, [key]: value };

        // Date validation logic
        if (key === 'start_date') {
          const newStartDate = value as string;
          // Only validate if newStartDate is not empty and a completion date exists
          if (newStartDate && updated.scheduled_completion_date) {
            if (!validateDates(newStartDate, updated.scheduled_completion_date)) {
              alert("Start date must be before or on the completion date. Setting completion date to the day after start date.");
              // Ensure getNextDayDate receives a valid date string
              const tempDate = new Date(newStartDate);
              if (isValidDate(tempDate)) {
                updated.scheduled_completion_date = getNextDayDate(newStartDate);
              } else {
                console.error("New start date is invalid, cannot calculate next day:", newStartDate);
                // Fallback if newStartDate itself is invalid
                updated.scheduled_completion_date = '';
              }
            }
          }
        } else if (key === 'scheduled_completion_date') {
          const newCompletionDate = value as string;
          // Only validate if newCompletionDate is not empty and a start date exists
          if (newCompletionDate && updated.start_date) {
            if (!validateDates(updated.start_date, newCompletionDate)) {
              alert("Completion date must be after or on the start date. Please choose a date after the start date.");
              return todo; // Return unchanged todo, preventing the update
            }
          }
        }

        // mark as complete when progress reaches 100%
        if (key === 'progress_rate' && value === 100) updated.completed_flg = true;
        // reset progress when unchecking completion
        if (key === 'completed_flg' && value === false) updated.progress_rate = 0;
        return updated;
      })
    );
  };

  // Function to get filtered list of tasks.
  // now includes date-based filtering
  const getFilteredTodos = () => {
    let resultTodos = [...todos];
    // Ensure currentDate is valid before formatting
    const formatted = isValidDate(currentDate) ? format(currentDate, 'yyyy-MM-dd') : '';
    const todayFormatted = format(new Date(), 'yyyy-MM-dd'); // This is usually safe

    if (filter === 'completed') {
      resultTodos = resultTodos.filter(
        t => t.completed_flg && !t.delete_flg
      );
    } else if (filter === 'unchecked') {
      resultTodos = resultTodos.filter(
        t => t.progress_rate < 100 && !t.delete_flg
      );
    } else if (filter === 'delete') {
      resultTodos = resultTodos.filter(t => t.delete_flg);
    } else if (filter === 'all') {
      if (formatted === todayFormatted) {
        resultTodos = resultTodos.filter(t => !t.delete_flg);
      } else {
        // Filter by start_date only if formatted date is valid (i.e., not empty)
        resultTodos = resultTodos.filter(t => formatted && t.start_date === formatted && !t.delete_flg);
      }
    }

    return resultTodos;
  };

  const handleFilterChange = (f: Filter) => {
    setFilter(f);
    setOpenAccordionId(null);
  };

  // Function to physically delete tasks (empty trash)
  const handleEmpty = () => {
    setTodos(todos.filter(t => !t.delete_flg));
    setOpenAccordionId(null);
  };

  // Function to handle back to calendar navigation with validation
  const handleBackToCalendar = () => {
    const incompleteTasks = todos.filter(t => !t.delete_flg && (!t.start_date || !t.scheduled_completion_date));

    if (incompleteTasks.length > 0) {
      alert("Please set start date and completion date for all tasks before going back to calendar.");
      return;
    }

    navigate('/');
  };

  // navigate to previous day
  const handlePreviousDay = () => {
    const newDate = new Date(currentDate);
    if (!isValidDate(newDate)) { // Defensive check
      console.error("Current date is invalid, cannot navigate to previous day.");
      return;
    }
    newDate.setDate(newDate.getDate() - 1);
    setCurrentDate(newDate);
    setFilter('all');
    setOpenAccordionId(null);
  };

  // navigate to next day
  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    if (!isValidDate(newDate)) { // Defensive check
      console.error("Current date is invalid, cannot navigate to next day.");
      return;
    }
    newDate.setDate(newDate.getDate() + 1);
    setCurrentDate(newDate);
    setFilter('all');
    setOpenAccordionId(null);
  };

  return (
    <div className="todo-container">
      {/* current date display */}
      <div className="date-display-header">
        {/* Only format if currentDate is valid, otherwise display a placeholder */}
        {isValidDate(currentDate) ? format(currentDate, 'MMMM d, yyyy').toUpperCase() : 'Invalid Date'}
      </div>

      {/* date navigation controls */}
      <div className="date-navigation">
        <button onClick={handlePreviousDay}>Last Day</button>
        <button onClick={handleBackToCalendar}>Back to Calendar</button>
        <button onClick={handleNextDay}>Next Day</button>
      </div>

      <div className="all-tasks">
        <select value={filter} onChange={(e) => handleFilterChange(e.target.value as Filter)}>
          <option value="all">All Tasks</option>
          <option value="completed">Completed Tasks</option>
          <option value="unchecked">Current Tasks</option>
          <option value="delete">Trash</option>
        </select>
      </div>

      {/* Show "Empty Trash" button when filter is `delete` */}
      {filter === 'delete' ? (
        <button className="empty-trash-btn" onClick={handleEmpty}>Empty Trash</button>
      ) : (filter === 'all' || filter === 'unchecked') && (
        // Show Todo input form for appropriate filters
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a new task..." />
          <button className="insert-btn" type="submit">Add</button>
        </form>
      )}

      <ul>
        {getFilteredTodos().map((todo) => (
          <li key={todo.id}>
            {/* main task row with all controls */}
            <div className="task-row">
              {/* progress percentage selector */}
              <div className="progress-rate-section">
                <label>Progress</label>
                <select
                  value={todo.progress_rate}
                  onChange={(e) => handleTodo(todo.id, 'progress_rate', Number(e.target.value))}
                  disabled={todo.completed_flg || todo.delete_flg}
                >
                  {[...Array(11).keys()].map(i => <option key={i} value={i * 10}>{i * 10}%</option>)}
                </select>
              </div>

              {/* date inputs for start and completion */}
              <div className="date-pickers-section">
                <div className="date-input-group">
                  <label>Start Date</label>
                  <input
                    type="date"
                    value={todo.start_date}
                    onChange={(e) => handleTodo(todo.id, 'start_date', e.target.value)}
                    disabled={todo.completed_flg || todo.delete_flg}
                  />
                </div>
                <div className="date-input-group">
                  <label>Completion Date</label>
                  <input
                    type="date"
                    value={todo.scheduled_completion_date}
                    onChange={(e) => handleTodo(todo.id, 'scheduled_completion_date', e.target.value)}
                    disabled={todo.completed_flg || todo.delete_flg}
                  />
                </div>
              </div>

              {/* task title input with completion styling */}
              <div className="task-content-section">
                <input
                  type="text"
                  value={todo.title}
                  onChange={(e) => handleTodo(todo.id, 'title', e.target.value)}
                  disabled={todo.progress_rate === 100}
                  style={todo.progress_rate === 100 ? { backgroundColor: '#e0e0e0', color: '#666' } : {}}
                />
              </div>

              {/* toggle accordion for detailed notes */}
              <button className="edit-btn" onClick={() => setOpenAccordionId(openAccordionId === todo.id ? null : todo.id)}>Edit</button>

              <button className={todo.delete_flg ? 'restore-btn' : 'delete-btn'} onClick={() => handleTodo(todo.id, 'delete_flg', !todo.delete_flg)}>
                {todo.delete_flg ? 'Restore' : 'Delete'}
              </button>
            </div>

            {/* expandable section for task details */}
            {openAccordionId === todo.id && (
              <div className="accordion-content">
                <textarea
                  value={todo.improvements}
                  onChange={(e) => handleTodo(todo.id, 'improvements', e.target.value)}
                  placeholder={`## Progress Status\n## Content\n## Background\n## Improvements`}
                ></textarea>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Todos;