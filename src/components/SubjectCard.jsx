import { useNavigate } from "react-router-dom";

function SubjectCard({ title, description, icon, iconBg }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/quiz/${title.toLowerCase()}`);
  };

  return (
    <button className="card" onClick={handleClick} type="button">
      <div className="icon-box" style={{ backgroundColor: iconBg }}>
        {icon}
      </div>
      <div className="card-body">
        <h3 className="card-title">{title}</h3>
        <p className="card-desc">{description}</p>
        <span className="card-cta">Start learning</span>
      </div>
    </button>
  );
}

export default SubjectCard;