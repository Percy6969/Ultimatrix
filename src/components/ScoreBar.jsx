import "./ScoreBar.css";

function ScoreBar({ score, color, position = "bottom-right" }) {
  return (
    <div className={`score-bar ${position}`}>
      <div className="score-label">Excellence</div>
      <div className="score-bg">
        <div
          className="score-fill"
          style={{
            width: `${score}%`,
            backgroundColor: color || "#14b8a6",
          }}
        />
      </div>
      <div className="score-percentage">{score}%</div>
    </div>
  );
}

export default ScoreBar;