import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import localforage from 'localforage';
import { type Todo } from "../index";
import '../../index.css';

const CalendarPage: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [searchTerm, setSearchTerm] = useState(""); // ADDED FEATURE
  const [currentDate, setCurrentDate] = useState(new Date());
  const calendarRef = useRef<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    localforage.getItem('todo-20240703').then((values) => {
      if (values) {
        setTodos(values as Todo[]);
      }
    });
  }, []);

  const fuzzyMatch = (text: string, search: string) => {
    return text.toLowerCase().includes(search.toLowerCase());
  };

  const matchedTodos = todos.filter(
    (t) => !t.delete_flg && !t.completed_flg && fuzzyMatch(t.title, searchTerm)
  );

  // ADDED FEATURE Auto-jump to month of first matched task
  useEffect(() => {
    if (!searchTerm.trim()) return;

    const firstMatch = matchedTodos[0];
    if (firstMatch && calendarRef.current) {
      calendarRef.current.getApi().gotoDate(firstMatch.start_date);
    }
  }, [searchTerm, todos]);

  const generateCalendarEvents = () => {
    return matchedTodos.map((task) => {
      const endDate = new Date(task.scheduled_completion_date);
      return {
        id: String(task.id),
        title: task.title,
        start: task.start_date,
        end: new Date(endDate.getTime() + 86400000).toISOString().split('T')[0],
        allDay: true,
        color: '#007BFF'
      };
    });
  };

  return (
    <div>
      {/* ADDED FEATURE Search Bar */}
      <div className="calendar-search-container">
        <input
          type="text"
          placeholder="Search Todo"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="calendar-search-input"
        />
      </div>

      {/* ADDED FEATURE Warning if no matching todos */}
      {searchTerm.trim() !== "" && matchedTodos.length === 0 && (
        <div className="search-warning">
          No such task found for "{searchTerm}"
        </div>
      )}

      {/*Calendar */}
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        initialDate={currentDate}
        events={generateCalendarEvents()}
        dateClick={(arg) => {
          const year = arg.date.getFullYear();
          const month = String(arg.date.getMonth() + 1).padStart(2, '0');
          const day = String(arg.date.getDate()).padStart(2, '0');
          navigate(`/todos?date=${year}-${month}-${day}`);
        }}
        headerToolbar={{ left: 'title', center: '', right: 'today prev,next' }}
        datesSet={(arg) => setCurrentDate(arg.start)}
      />
    </div>
  );
};

export default CalendarPage;
