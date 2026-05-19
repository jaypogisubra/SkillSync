const features = [
  {
    icon: "▤",
    title: "Resume Screening",
    description: "Upload your resume and prepare structured profile details.",
  },
  {
    icon: "◎",
    title: "Skill Alignment",
    description: "Organize your strengths, experience, and target skills.",
  },
  {
    icon: "▣",
    title: "Job Matching",
    description: "Prepare your account for future job matching results.",
  },
  {
    icon: "↗",
    title: "Career Growth",
    description: "Build a profile that supports your long-term career goals.",
  },
];

export default function FeatureCards() {
  return (
    <section className="feature-section">
      <div className="section-header">
        <span>What SkillSync helps with</span>
        <h2>A cleaner way to prepare for the right opportunity.</h2>
      </div>

      <div className="feature-grid">
        {features.map((feature) => (
          <article className="feature-card" key={feature.title}>
            <span className="feature-icon">{feature.icon}</span>
            <h3>{feature.title}</h3>
            <p>{feature.description}</p>
          </article>
        ))}
      </div>
    </section>
  );
}