//tasks detail screen 

import React, { useState, useEffect } from 'react';
import localforage from 'localforage'; // CORRECTED IMPORT: 'localforage' (removed extra 'for')
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
  start_date: string; // task start date
  scheduled_completion_date: string; // target completion date
  improvements: string; // detailed notes and improvements
  // NEW FEATURES: Add image support for drag and drop functionality
  images: string[]; // Array to store base64 encoded images
};

type Filter = 'all' | 'completed' | 'unchecked' | 'delete';

// extract URL query parameters for date navigation
function useQuery() {
  return new URLSearchParams(useLocation().search); // added To call useLocation
}

// NEW FEATURE: Simple markdown parser function
// This function converts basic markdown syntax to HTML
export const parseMarkdown = (text: string): string => {
  if (!text) return '';

  // Convert markdown to HTML with basic syntax support
  return text
    .replace(/\*\*([^*]+)\*\*|__([^_]+)__/g, '<strong>$1$2</strong>')
    .replace(/\*([^*]+)\*|_([^_]+)_/g, '<em>$1$2</em>')
    .replace(/~~(.*?)~~/g, '<del>$1</del>')
    .replace(/```(.*?)```/gs, '<pre><code>$1</code></pre>')
    .replace(/`(.*?)`/g, '<code>$1</code>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>')
    .replace(/^### (.*)$/gm, '<h3>$1</h3>')
    .replace(/^## (.*)$/gm, '<h2>$1</h2>')
    .replace(/^# (.*)$/gm, '<h1>$1</h1>')
    .replace(/---/g, '<hr>')
    .replace(/\n/g, '<br>');
};



// Define the Todo component
const Todos: React.FC = () => {
  const query = useQuery(); // added Extracts the date query parameter
  const queryDate = query.get('date'); // added State to store the list of todos
  const [todos, setTodos] = useState<Todo[]>([]); // State to hold the array of Todos.
  const [text, setText] = useState(''); // State for form input.
  const [nextId, setNextId] = useState(1); // State to hold the ID of the next Todo.
  const [filter, setFilter] = useState<Filter>('all'); // Filter state.

  // State to track markdown display mode (raw vs parsed) for improvements field
  const [markdownDisplayMode, setMarkdownDisplayMode] = useState<{ [key: number]: boolean }>({});

  // handle date from URL or default to today
  const [currentDate, setCurrentDate] = useState(() => {
    if (queryDate) { // added If queryDate exists, parse it and set it as the initial date
      try {
        const [y, m, d] = queryDate.split('-').map(Number);
        // Validate the date components
        if (y && m && d && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
          const date = new Date(y, m - 1, d); // Month is 0-indexed in Date constructor
          // Check if the date is valid
          if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) {
            return date;
          }
        }
      } catch (error) {
        console.error('Invalid date format in URL:', queryDate);
      }
    }
    // set the initial date to the current day 
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });

  // track which accordion is open (only one at a time)
  const [openAccordionId, setOpenAccordionId] = useState<number | null>(null);   // added Hook to programmatically navigate between routes


  const navigate = useNavigate(); // Get the navigation function

  // load todos and filter state on mount
  useEffect(() => {
    // FIX for 'values' implicit any type and type incompatibility
    localforage.getItem('todo-20240703').then((values: unknown) => { // Type as unknown
      if (values) {
        // Cast to Todo[] only when you are sure it's not null/undefined
        setTodos(values as Todo[]);
        // ensure nextId doesn't conflict with existing todos
        const maxId = Math.max(...(values as Todo[]).map(todo => todo.id), 0);
        setNextId(maxId + 1);
      }
    });
    // remember filter selection between sessions
    // FIX for 'value' implicit any type and type incompatibility
    localforage.getItem('filterState-20240703').then((value: unknown) => { // Type as unknown
      if (value) setFilter(value as Filter); // Cast to Filter
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

    // Get the currently selected date in YYYY-MM-DD format
    const selectedDate = format(currentDate, 'yyyy-MM-dd');

    const newTodo: Todo = {
      title: trimmed,
      id: nextId,
      completed_flg: false,
      delete_flg: false,
      progress_rate: 0,
      start_date: selectedDate,
      scheduled_completion_date: selectedDate,
      improvements: '',
      images: []
    };
    // keep todos sorted by ID
    setTodos(prev => [...prev, newTodo].sort((a, b) => a.id - b.id));
    setNextId(nextId + 1);
    setText('');
  };

  // Date validation function
  const validateDates = (startDate: string, completionDate: string) => {
    const start = new Date(startDate);
    const completion = new Date(completionDate);
    return start <= completion;
  };

  // Function to get the next day date string
  const getNextDayDate = (dateString: string) => {
    const date = new Date(dateString);
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
          if (newStartDate && todo.scheduled_completion_date && !validateDates(newStartDate, todo.scheduled_completion_date)) {
            alert("Start date must be before or on the completion date. Setting completion date to the day after start date.");
            updated.scheduled_completion_date = getNextDayDate(newStartDate);
          }
        } else if (key === 'scheduled_completion_date') {
          const newCompletionDate = value as string;
          if (newCompletionDate && todo.start_date && !validateDates(todo.start_date, newCompletionDate)) {
            alert("Completion date must be after or on the start date. Please choose a date after the start date.");
            return todo; // Return unchanged todo, preventing the update
          }
        }

        // mark as complete when progress reaches 100%
        if (key === 'progress_rate' && value === 100) updated.completed_flg = true;
        // mark as incomplete when progress is reduced below 100%
        if (key === 'progress_rate' && typeof value === 'number' && value < 100) updated.completed_flg = false;
        // reset progress when unchecking completion
        if (key === 'completed_flg' && value === false) updated.progress_rate = 0;
        return updated;
      })
    );
  };

  // NEW FEATURE: Handle image drag and drop functionality
  // This function processes dropped files and converts them to base64 strings
  const handleImageDrop = (e: React.DragEvent<HTMLDivElement>, todoId: number) => {
    e.preventDefault();
    e.stopPropagation();

    const files = Array.from(e.dataTransfer.files);
    // Filter only image files (jpg, jpeg, png, gif, etc.)
    const imageFiles = files.filter(file => file.type.startsWith('image/'));

    if (imageFiles.length === 0) {
      alert('Please drop only image files.');
      return;
    }

    // Process each image file
    imageFiles.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const imageData = event.target?.result as string;
        // Add the image to the todo's images array
        setTodos(prev => prev.map(todo => {
          if (todo.id === todoId) {
            return {
              ...todo,
              images: [...todo.images, imageData]
            };
          }
          return todo;
        }));
      };
      reader.readAsDataURL(file); // Convert file to base64 string
    });
  };

  // NEW FEATURE: Handle drag over event to allow dropping
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  // NEW FEATURE: Remove image from todo
  const handleRemoveImage = (todoId: number, imageIndex: number) => {
    setTodos(prev => prev.map(todo => {
      if (todo.id === todoId) {
        return {
          ...todo,
          images: todo.images.filter((_, index) => index !== imageIndex)
        };
      }
      return todo;
    }));
  };

  // NEW FEATURE: Toggle markdown display mode
  const toggleMarkdownDisplay = (todoId: number) => {
    setMarkdownDisplayMode(prev => ({
      ...prev,
      [todoId]: !prev[todoId]
    }));
  };

  // Function to get filtered list of tasks.
  // now includes date-based filtering
  const getFilteredTodos = () => {
    let resultTodos = [...todos];
    const formatted = format(currentDate, 'yyyy-MM-dd');
    const todayFormatted = format(new Date(), 'yyyy-MM-dd');

    if (filter === 'completed') {
      // Return tasks that are completed AND not deleted.
      resultTodos = resultTodos.filter(
        t => t.completed_flg && !t.delete_flg
      );
    } else if (filter === 'unchecked') {
      // Return tasks that are incomplete AND not deleted.
      // using progress_rate for more granular control
      resultTodos = resultTodos.filter(
        t => t.progress_rate < 100 && !t.delete_flg
      );
    } else if (filter === 'delete') {
      // Return deleted tasks.
      resultTodos = resultTodos.filter(t => t.delete_flg);
    } else if (filter === 'all') {
      // show all tasks for today, or date-specific tasks for other dates
      if (formatted === todayFormatted) {
        resultTodos = resultTodos.filter(t => !t.delete_flg);
      } else {
        resultTodos = resultTodos.filter(t => t.start_date === formatted && !t.delete_flg);
      }
    }

    return resultTodos;
  };

  const handleFilterChange = (f: Filter) => {
    setFilter(f);
    // close accordion when switching filters
    setOpenAccordionId(null);
  };

  // Function to physically delete tasks (empty trash)
  const handleEmpty = () => {
    setTodos(todos.filter(t => !t.delete_flg));
    setOpenAccordionId(null);
  };

  // Function to handle back to calendar navigation
  const handleBackToCalendar = () => {
    navigate('/');
  };

  // navigate to previous day
  const handlePreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
    setFilter('all');
    setOpenAccordionId(null);
  };

  // navigate to next day
  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
    setFilter('all');
    setOpenAccordionId(null);
  };

  return (
    <div className="todo-container">
      {/* current date display */}
      <div className="date-display-header">
        {format(currentDate, 'MMMM d, yyyy').toUpperCase()}
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
                  disabled={todo.delete_flg}
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
                {/* Image Drop Area */}
                <div
                  className="image-drop-area"
                  onDrop={(e) => handleImageDrop(e, todo.id)}
                  onDragOver={handleDragOver}
                >
                  Drag and drop images here (JPG, PNG, GIF)
                </div>

                {/* Displaying Images with Removal Option */}
                <div className="images-container">
                  {todo.images.map((image, index) => (
                    <div key={index} className="image-preview">
                      <img src={image} alt={`Todo Image ${index}`} />
                      <button onClick={() => handleRemoveImage(todo.id, index)} className="remove-image-btn">Remove</button>
                    </div>
                  ))}
                </div>

                {/* Improvements Textarea with Markdown Toggle */}
                <div className="improvements-section">
                  <button onClick={() => toggleMarkdownDisplay(todo.id)} className="markdown-toggle-btn">
                    {markdownDisplayMode[todo.id] ? 'Edit Markdown' : 'View HTML'}
                  </button>
                  {markdownDisplayMode[todo.id] ? (
                    // Display parsed HTML if markdownDisplayMode is true
                    <div className="markdown-preview" dangerouslySetInnerHTML={{ __html: parseMarkdown(todo.improvements) }} />
                  ) : (
                    // Display textarea for editing
                    <textarea
                      value={todo.improvements}
                      onChange={(e) => handleTodo(todo.id, 'improvements', e.target.value)}
                      placeholder={`## Progress Status\n## Content\n## Background\n## Improvements`}
                    ></textarea>
                  )}
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Todos;

