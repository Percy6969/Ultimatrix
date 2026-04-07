import { Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Quiz from "./pages/Quiz";

function App() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/quiz/:subject" element={<Quiz />} />
    </Routes>
  );
}

export default App;