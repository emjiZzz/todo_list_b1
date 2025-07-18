//tasks detail screen 

import React, { useState, useEffect } from 'react';
import localforage from 'localforage';
import { format } from 'date-fns'; // date formatting utility
import { useLocation, useNavigate } from 'react-router-dom'; // Import useNavigate for routing / location
import '../index.css';
import ReactMarkdown from 'react-markdown'; // NF TODO A 
import remarkGfm from 'remark-gfm'; // NF TODO A 

// Define the "Todo" type of the component
// extended with new fields for task management
export type Todo = {
  title: string;
  readonly id: number;
  completed_flg: boolean;
  delete_flg: boolean;
  progress_rate: number;
  start_date: string;
  scheduled_completion_date: string;
  improvements: string;
  images?: { [key: string]: string }; // NF TODO A Store image URLs by filename
};

type Filter = 'all' | 'completed' | 'unchecked' | 'delete';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

// NF TODO A  MARKDOWN FUNCTIONALITY
const MarkdownPreviewPage: React.FC<{ id: string; onBack: () => void }> = ({ id, onBack }) => {
  const [markdown, setMarkdown] = useState('');
  const [todo, setTodo] = useState<Todo | null>(null);

  useEffect(() => {
    localforage.getItem('todo-20240703').then((data) => {
      if (data) {
        const todos = data as Todo[];
        const found = todos.find((t) => String(t.id) === id);
        if (found) {
          setTodo(found);
          setMarkdown(found.improvements || '');
        } else {
          setMarkdown('**Task not found**');
        }
      }
    });
  }, [id]);

  // FIXED: Function to handle checkbox toggle in markdown
  const handleCheckboxChange = (checkboxIndex: number) => {
    const lines = markdown.split('\n');
    let currentCheckboxIndex = 0;

    const updatedLines = lines.map(line => {
      if (line.includes('- [') || line.includes('- [x]')) {
        if (currentCheckboxIndex === checkboxIndex) {
          if (line.includes('- [x]')) {
            currentCheckboxIndex++;
            return line.replace('- [x]', '- [ ]');
          } else if (line.includes('- [ ]')) {
            currentCheckboxIndex++;
            return line.replace('- [ ]', '- [x]');
          }
        }
        currentCheckboxIndex++;
      }
      return line;
    });

    const updatedMarkdown = updatedLines.join('\n');
    setMarkdown(updatedMarkdown);

    // Update the todo in storage
    if (todo) {
      const updatedTodo = { ...todo, improvements: updatedMarkdown };
      localforage.getItem('todo-20240703').then((data) => {
        if (data) {
          const todos = data as Todo[];
          const updatedTodos = todos.map(t => t.id === todo.id ? updatedTodo : t);
          localforage.setItem('todo-20240703', updatedTodos);
        }
      });
    }
  };

  // > NF TODO A  tASK TITLE MARKDOWN DISPLAY
  return (
    <div className="markdown-preview-page">
      <div className="markdown-preview-content">
        {todo && (
          <p className="markdown-task-title">
            {todo.title}
          </p>
        )}

        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            img: ({ node, src, alt, ...props }) => {
              if (src && todo?.images && todo.images[src]) {
                return (
                  <img
                    {...props}
                    src={todo.images[src]}
                    alt={alt || 'Image'}
                    className="markdown-image"
                  />
                );
              }
              return (
                <img
                  {...props}
                  src={src}
                  alt={alt || 'Image'}
                  className="markdown-image"
                />
              );
            },

            // FIXED: NF TODO A LIST ITEM MARKDOWN DISPLAY bullet, checkbox - consistent styling
            li: ({ node, children, ...props }) => {
              const className = (props as any).className || '';
              const isTaskItem = className.includes('task-list-item');
              return (
                <li
                  {...props}
                  className={`markdown-list-item ${isTaskItem ? 'task-list-item' : ''}`}
                >
                  <div className="markdown-list-content">
                    {!isTaskItem && (
                      <span className="markdown-bullet">
                        •
                      </span>
                    )}
                    <div className="markdown-list-text">
                      {children}
                    </div>
                  </div>
                </li>
              );
            },

            // FIXED: NF TODO A LIST ITEM MARKDOWN DISPLAY checkbox - functional toggle
            input: ({ node, ...props }) => {
              if (props.type === 'checkbox') {
                // Get the checkbox index from the markdown
                const checkboxIndex = (() => {
                  const lines = markdown.split('\n');
                  let index = 0;
                  for (let i = 0; i < lines.length; i++) {
                    if (lines[i].includes('- [') || lines[i].includes('- [x]')) {
                      // This is a simplified approach - you might need to adjust based on your specific use case
                      if (lines[i].includes(props.checked ? '- [x]' : '- [ ]')) {
                        return index;
                      }
                      index++;
                    }
                  }
                  return index;
                })();

                return (
                  <input
                    {...props}
                    className="markdown-checkbox"
                    disabled={false}
                    onChange={() => handleCheckboxChange(checkboxIndex)}
                  />
                );
              }
              return <input {...props} />;
            },

            ul: ({ node, children, ...props }) => {
              return (
                <ul
                  {...props}
                  className="markdown-unordered-list"
                >
                  {children}
                </ul>
              );
            },
            ol: ({ node, children, ...props }) => {

              return (
                <ol
                  {...props}
                  className="markdown-ordered-list"
                >
                  {children}
                </ol>
              );
            }
          }}
        >
          {markdown}
        </ReactMarkdown>
      </div>
      <button className="back-red-btn" onClick={onBack}>Back</button>
    </div >
  );
};


// NF TODO A Function to check for duplicate task titles (case-insensitive, trimmed)
// This function helps us prevent users from adding the same task title twice.
const isDuplicateTitle = (todos: Todo[], newTitle: string): boolean => {
  return todos.some(todo => todo.title.trim().toLowerCase() === newTitle.trim().toLowerCase());
};

// Define the Todo component
const Todos: React.FC = () => {
  const query = useQuery();
  const queryDate = query.get('date');
  const [todos, setTodos] = useState<Todo[]>([]);
  const [text, setText] = useState('');
  const [nextId, setNextId] = useState(1);
  const [filter, setFilter] = useState<Filter>('all');
  const [showMarkdownId, setShowMarkdownId] = useState<string | null>(null);

  const [currentDate, setCurrentDate] = useState(() => {
    if (queryDate) {
      try {
        const [y, m, d] = queryDate.split('-').map(Number);
        if (y && m && d && m >= 1 && m <= 12 && d >= 1 && d <= 31) {
          const date = new Date(y, m - 1, d);
          if (date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d) {
            return date;
          }
        }
      } catch (error) {
        console.error('Invalid date format in URL:', queryDate);
      }
    }
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  });

  const [openAccordionId, setOpenAccordionId] = useState<number | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    localforage.getItem('todo-20240703').then((values) => {
      if (values) {
        setTodos(values as Todo[]);
        const maxId = Math.max(...(values as Todo[]).map(todo => todo.id), 0);
        setNextId(maxId + 1);
      }
    });
    localforage.getItem('filterState-20240703').then((value) => {
      if (value) setFilter(value as Filter);
    });
  }, []);

  useEffect(() => {
    localforage.setItem('todo-20240703', todos);
  }, [todos]);

  useEffect(() => {
    localforage.setItem('filterState-20240703', filter);
  }, [filter]);

  const handleSubmit = () => {
    const trimmed = text.trim();
    if (!trimmed) {
      alert("Task cannot be empty.");
      return;
    }

    // NEW F: Check if the task title already exists
    if (isDuplicateTitle(todos, trimmed)) {
      alert("Task with the same title already exists.");
      return;
    }

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
      images: {},
    };
    setTodos(prev => [...prev, newTodo].sort((a, b) => a.id - b.id));
    setNextId(nextId + 1);
    setText('');
  };

  const validateDates = (startDate: string, completionDate: string) => {
    const start = new Date(startDate);
    const completion = new Date(completionDate);
    return start <= completion;
  };

  const getNextDayDate = (dateString: string) => {
    const date = new Date(dateString);
    date.setDate(date.getDate() + 1);
    return format(date, 'yyyy-MM-dd');
  };

  const handleTodo = <K extends keyof Todo, V extends Todo[K]>(id: number, key: K, value: V) => {
    setTodos((todos) =>
      todos.map((todo) => {
        if (todo.id !== id) return todo;
        let updated = { ...todo, [key]: value };

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
            return todo;
          }
        }

        if (key === 'progress_rate' && value === 100) updated.completed_flg = true;
        if (key === 'progress_rate' && typeof value === 'number' && value < 100) updated.completed_flg = false;
        if (key === 'completed_flg' && value === false) updated.progress_rate = 0;
        return updated;
      })
    );
  };

  const getFilteredTodos = () => {
    let resultTodos = [...todos];
    const formatted = format(currentDate, 'yyyy-MM-dd');
    const todayFormatted = format(new Date(), 'yyyy-MM-dd');
    if (filter === 'completed') {
      resultTodos = resultTodos.filter(t => t.completed_flg && !t.delete_flg);
    } else if (filter === 'unchecked') {
      resultTodos = resultTodos.filter(t => t.progress_rate < 100 && !t.delete_flg);
    } else if (filter === 'delete') {
      resultTodos = resultTodos.filter(t => t.delete_flg);
    } else if (filter === 'all') {
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
    setOpenAccordionId(null);
  };

  const handleEmpty = () => {
    setTodos(todos.filter(t => !t.delete_flg));
    setOpenAccordionId(null);
  };

  const handleBackToCalendar = () => {
    navigate('/');
  };

  const handlePreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
    setFilter('all');
    setOpenAccordionId(null);
  };

  const handleNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
    setFilter('all');
    setOpenAccordionId(null);
  };

  // FIXED NF TODO A: Enhanced image drag and drop function to handle all image types
  const handleImageDrop = (e: React.DragEvent<HTMLTextAreaElement>, todoId: number) => {
    e.preventDefault();

    // Get all files from the drop event
    const files = Array.from(e.dataTransfer.files);

    // Filter for image files with comprehensive image type checking
    const imageFiles = files.filter(file => {
      // Check MIME type first
      if (file.type.startsWith("image/")) {
        return true;
      }

      // NF TODO A Fallback : check file extension for common image formats
      const fileName = file.name.toLowerCase();
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff', '.tif'];
      return imageExtensions.some(ext => fileName.endsWith(ext));
    });

    if (imageFiles.length === 0) {
      alert("Please drop valid image files only.");
      return;
    }

    // Process each image file
    imageFiles.forEach(file => {
      try {
        // Create object URL for the image
        const imageUrl = URL.createObjectURL(file);

        // Generate unique key for the image
        const imageKey = `${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create markdown for the image
        const markdown = `\n\n![${file.name}](${imageKey})\n\n`;

        setTodos(prevTodos =>
          prevTodos.map((t) => {
            if (t.id !== todoId) return t;
            const currentImages = t.images || {};
            
            return {
              ...t,
              improvements: t.improvements + markdown,
              images: {
                ...currentImages,
                [imageKey]: imageUrl
              }
            };
          })
        );
      } catch (error) {
        console.error('Error processing image file:', file.name, error);
        alert(`Error processing image: ${file.name}`);
      }
    });
  };

  if (showMarkdownId) {
    return <MarkdownPreviewPage id={showMarkdownId} onBack={() => setShowMarkdownId(null)} />;
  }

  return (
    <div className="todo-container">
      <div className="date-display-header">
        {format(currentDate, 'MMMM d, yyyy').toUpperCase()}
      </div>

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

      {filter === 'delete' ? (
        <button className="empty-trash-btn" onClick={handleEmpty}>Empty Trash</button>
      ) : (filter === 'all' || filter === 'unchecked') && (
        <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <input type="text" value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a new task..." />
          <button className="insert-btn" type="submit">Add</button>
        </form>
      )}

      <ul>
        {getFilteredTodos().map((todo) => (
          <li key={todo.id}>
            <div className="task-row">
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

              <div className="task-content-section">
                <input
                  type="text"
                  value={todo.title}
                  onChange={(e) => handleTodo(todo.id, 'title', e.target.value)}
                  disabled={todo.progress_rate === 100}
                  style={todo.progress_rate === 100 ? { backgroundColor: '#e0e0e0', color: '#666' } : {}}
                />
              </div>

              <button className="edit-btn" onClick={() => setOpenAccordionId(openAccordionId === todo.id ? null : todo.id)}>Edit</button>
              <button className={todo.delete_flg ? 'restore-btn' : 'delete-btn'} onClick={() => handleTodo(todo.id, 'delete_flg', !todo.delete_flg)}>
                {todo.delete_flg ? 'Restore' : 'Delete'}
              </button>
            </div>

            {openAccordionId === todo.id && (
              <div className="accordion-content">
                <textarea
                  value={todo.improvements}
                  onChange={(e) => handleTodo(todo.id, 'improvements', e.target.value)}
                  placeholder={`## Progress Status\n## Content\n## Background\n## Improvements`}
                  onDrop={(e) => handleImageDrop(e, todo.id)}
                  onDragOver={(e) => e.preventDefault()}
                ></textarea>

                <button
                  className="markdown-toggle-btn"
                  onClick={() => setShowMarkdownId(String(todo.id))}
                >
                  Markdown Display
                </button>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Todos;
