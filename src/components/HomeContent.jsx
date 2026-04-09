import SubjectCard from "./SubjectCard";
import "./HomeContent.css";

function HomeContent() {
  return (
    <div className="home-content">
      <div className="hero-copy">
        <h1 className="hero-brand">SOCRATIC MIRROR</h1>
        <span className="tagline-badge">AI-powered learning companion</span>
        <h2 className="hero-title">Choose a topic to begin your learning journey</h2>
        <p className="hero-subtitle">
          Pick a subject and start practicing with curated questions designed to build confidence.
        </p>
      </div>

      <div className="grid">
        <SubjectCard
          title="Physics"
          description="Explore the fundamental laws of nature and the physical world"
          icon="⚛️"
          iconBg="#2563eb"
        />

        <SubjectCard
          title="Chemistry"
          description="Understand matter, reactions, and molecular structures"
          icon="🧪"
          iconBg="#14b8a6"
        />

        <SubjectCard
          title="Mathematics"
          description="Master numbers, patterns, and logical reasoning"
          icon="📐"
          iconBg="#8b5cf6"
        />
      </div>
    </div>
  );
}

export default HomeContent;