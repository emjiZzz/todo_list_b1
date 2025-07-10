import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Todos from './components/index'; // Import the Todos component
import CalendarPage from './components/Todos/CalendarPage'; // Import the CalendarPage component
import Top from './components/Top'; // Assuming this path is correct
import Todos from './components/index'; // Corrected import path for Todos

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<CalendarPage />} /> {/* Default route shows calendar */}
        <Route path="/calendar" element={<CalendarPage />} /> {/* Calendar page route */}
        <Route path="/todos" element={<Todos />} /> {/* Todos page route */}

        <Route path="/" element={<Top />} />
        <Route path="/todos" element={<Todos />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;
