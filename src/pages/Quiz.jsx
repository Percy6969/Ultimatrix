import { useParams, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import ScoreBar from "../components/ScoreBar";
import Sidebar from "../components/Sidebar";
import { generateQuestion, validateAnswer } from "../services/ai";
import "./Quiz.css";

function Quiz() {
  const { subject } = useParams();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [scores, setScores] = useState(() => {
    const saved = localStorage.getItem("quizScores");
    return saved ? JSON.parse(saved) : { physics: 50, chemistry: 50, mathematics: 50 };
  });

  const score = scores[subject] ?? 50;

  const updateScore = (newScore) => {
    setScores(prev => {
      const nextScores = { ...prev, [subject]: newScore };
      localStorage.setItem("quizScores", JSON.stringify(nextScores));
      return nextScores;
    });
  };

  const [answer, setAnswer] = useState("");

  const [question, setQuestion] = useState("Loading question...");
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(true);
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [feedback, setFeedback] = useState("");

  const subjectConfig = {
    physics: { color: "#2563eb", label: "Physics" },
    chemistry: { color: "#14b8a6", label: "Chemistry" },
    mathematics: { color: "#8b5cf6", label: "Mathematics" },
  };

  const config = subjectConfig[subject] || subjectConfig.physics;

  const loadQuestion = async () => {
    setIsLoadingQuestion(true);
    setFeedback("");
    setAnswer("");
    const newQ = await generateQuestion(config.label);
    setQuestion(newQ);
    setIsLoadingQuestion(false);
  };

  useEffect(() => {
    loadQuestion();
  }, [subject]);

  const isComplete = score >= 100;
  const isFailed = score <= 0;
  const isFinal = isComplete || isFailed;

  const resetSubject = () => {
    updateScore(50);
    setFeedback("");
    setAnswer("");
    setQuestion("Loading question...");
    setIsLoadingQuestion(true);
    loadQuestion();
  };

  const checkAnswer = async () => {
    if (!answer.trim() || isFinal) return;
    setIsEvaluating(true);

    const result = await validateAnswer(question, answer, config.label);

    if (result.isCorrect) {
      updateScore(Math.min(score + 10, 100));
    } else {
      updateScore(Math.max(score - 10, 0));
    }

    setFeedback(result.explanation);
    setIsEvaluating(false);
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

          {isFinal ? (
            <div className="final-screen" style={{ backgroundImage: isComplete ? 'none' : 'linear-gradient(135deg, rgba(148, 187, 233, 0.15) 0%, rgba(179, 157, 219, 0.15) 100%)' }}>
              {isComplete ? (
                <div className="final-stars" style={{ color: config.color }}>
                  {Array.from({ length: 5 }).map((_, index) => (
                    <span key={index}>★</span>
                  ))}
                </div>
              ) : (
                <div className="final-emoji-illustration">🤔</div>
              )}
              <h2 className="final-title">
                {isComplete ? `5-Star in ${config.label}` : "No Worries... Try Again"}
              </h2>
              <p className="final-copy">
                {isComplete
                  ? "Congratulations! You've mastered this topic."
                  : "Mistakes happen! Learning is a journey, and every attempt brings you closer to mastery. Let's give it another shot! 🚀"}
              </p>
              <div className="final-actions">
                <button className="final-primary-btn" onClick={() => navigate("/")}>{isComplete ? '' : '⬅️ '}Back to Topics</button>
                <button className="final-secondary-btn" style={{ borderColor: config.color, color: config.color }} onClick={resetSubject}>
                  {isComplete ? '🔄 Try Again' : '🔄 Start Over'}
                </button>
              </div>
            </div>
          ) : (
            <div className="question-card">
              <h2 className="question-label">Question</h2>
              <p className="question-text">
                {isLoadingQuestion ? <span className="loading-text" style={{ color: '#9ca3af', fontStyle: 'italic' }}>Our AI is generating a question...</span> : question}
              </p>

              <textarea
                className="answer-input"
                placeholder="Enter your answer..."
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                disabled={isLoadingQuestion || isEvaluating || !!feedback}
              />

              {feedback ? (
                <div className={`feedback-box ${score < 100 && feedback.toLowerCase().includes('incorrect') ? 'incorrect' : 'correct'}`}>
                  <p style={{ margin: '0 0 16px', lineHeight: '1.5', color: '#374151' }}><strong>AI Feedback:</strong> {feedback}</p>
                  <button
                    className="submit-btn"
                    style={{ backgroundColor: config.color }}
                    onClick={loadQuestion}
                  >
                    Next Question
                  </button>
                </div>
              ) : (
                <button
                  className="submit-btn"
                  style={{ backgroundColor: config.color, opacity: (isLoadingQuestion || isEvaluating || !answer.trim()) ? 0.7 : 1 }}
                  onClick={checkAnswer}
                  disabled={isLoadingQuestion || isEvaluating || !answer.trim()}
                >
                  {isEvaluating ? "Evaluating..." : "Submit Answer"}
                </button>
              )}
            </div>
          )}
        </div>

        <ScoreBar score={score} color={config.color} />
      </div>
    </div>
  );
}

export default Quiz;