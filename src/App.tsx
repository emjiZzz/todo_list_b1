import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Top from './components/Top'; // Assuming this path is correct
import Todos from './components/index'; // Corrected import path for Todos

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Top />} />
        <Route path="/todos" element={<Todos />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
