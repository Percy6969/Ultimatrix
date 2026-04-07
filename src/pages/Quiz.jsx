import { useParams, useNavigate } from "react-router-dom";
import { useState } from "react";
import ScoreBar from "../components/ScoreBar";
import Sidebar from "../components/Sidebar";
import "./Quiz.css";

function Quiz() {
  const { subject } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [score, setScore] = useState(82);
  const [answer, setAnswer] = useState("");

  const questions = {
    physics: "What is the difference between velocity and speed?",
    chemistry: "What is the difference between an exothermic and endothermic reaction?",
    mathematics: "What is the derivative of x^3 + 2x^2 + 5?",
  };

  const subjectConfig = {
    physics: { color: "#2563eb", label: "Physics" },
    chemistry: { color: "#14b8a6", label: "Chemistry" },
    mathematics: { color: "#8b5cf6", label: "Mathematics" },
  };

  const config = subjectConfig[subject] || subjectConfig.physics;
  const question = questions[subject] || "Sample question";

  const checkAnswer = () => {
    if (answer.toLowerCase() === "correct") {
      setScore(Math.min(score + 10, 100));
    } else {
      setScore(Math.max(score - 10, 0));
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div className="quiz-layout">
      {sidebarOpen && <Sidebar />}
      <div className="quiz-page" style={{ "--subject-color": config.color }}>
        <div className="quiz-container">
          <button
            className="hamburger-btn"
            onClick={toggleSidebar}
            aria-label="Toggle sidebar"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
        <button className="back-link" onClick={() => navigate("/")}>
          ← Back to Topics
        </button>

        <h1 className="quiz-title">{config.label}</h1>

        <div className="question-card">
          <h2 className="question-label">Question</h2>
          <p className="question-text">{question}</p>

          <textarea
            className="answer-input"
            placeholder="Enter your answer..."
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
          />

          <button
            className="submit-btn"
            style={{ backgroundColor: config.color }}
            onClick={checkAnswer}
          >
            Submit Answer
          </button>
        </div>
      </div>

      <ScoreBar score={score} color={config.color} />
    </div>
    </div>
  );
}

export default Quiz;