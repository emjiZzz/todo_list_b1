// FILE: src/components/Todos/CalendarPage.tsx

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import interactionPlugin from '@fullcalendar/interaction';
import localforage from 'localforage';
import { type Todo } from "../index"; // Fixed import
import '../../index.css';

const CalendarPage: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [currentDate] = useState(new Date());
  const navigate = useNavigate();

  // load todos from local storage on component mount
  useEffect(() => {
    localforage.getItem('todo-20240703').then((values) => {
      if (values) {
        setTodos(values as Todo[]);
      }
    });
  }, []);

  // check if a given date falls within a task's start and end date range
  const isDateInTaskPeriod = (date: string, task: Todo): boolean => {
    const checkDate = new Date(date);
    const startDate = new Date(task.start_date);
    const endDate = new Date(task.scheduled_completion_date);

    // normalize all dates to start of day to avoid timezone issues
    checkDate.setHours(0, 0, 0, 0);
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(0, 0, 0, 0);

    return checkDate >= startDate && checkDate <= endDate;
  };

  // create calendar events from todos for FullCalendar display
  const generateCalendarEvents = () => {
    const events: any[] = [];

    // only show active (not deleted or completed) tasks
    todos
      .filter((t) => !t.delete_flg && !t.completed_flg)
      .forEach((task) => {
        const startDate = new Date(task.start_date);
        const endDate = new Date(task.scheduled_completion_date);

        // create spanning event for the entire task duration
        events.push({
          id: String(task.id),
          title: task.title,
          start: task.start_date,
          // add 1 day to end date for inclusive range (FullCalendar needs exclusive end)
          end: new Date(endDate.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          allDay: true,
          color: '#007BFF'
        });
      });

    return events;
  };

  return (
    <div>
      <FullCalendar
        plugins={[dayGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        events={generateCalendarEvents()}
        dateClick={(arg) => {
          // manually format date to avoid timezone issues
          const year = arg.date.getFullYear();
          const month = String(arg.date.getMonth() + 1).padStart(2, '0');
          const day = String(arg.date.getDate()).padStart(2, '0');
          const dateStr = `${year}-${month}-${day}`;

          // navigate to todos page with selected date as query parameter
          navigate(`/todos?date=${dateStr}`);
        }}
        initialDate={currentDate}
        headerToolbar={{ left: 'title', center: '', right: 'today prev,next' }}
      />
    </div>
  );
};

export default CalendarPage;