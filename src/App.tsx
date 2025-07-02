import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Top from './components/Top';
import Todo from './components/index'; // Corrected import path for your Todo component

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Top />} />
        <Route path="/todos" element={<Todo />} /> {/* Use the corrected component name */}
      </Routes>
    </BrowserRouter>
  );
}

export default App;