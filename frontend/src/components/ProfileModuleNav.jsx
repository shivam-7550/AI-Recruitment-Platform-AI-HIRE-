const modules = [
  ["basic-details", "Basic details"],
  ["education", "Education"],
  ["skills", "Skills"],
  ["languages", "Languages"],
  ["internship", "Internship"],
  ["resume", "Resume"],
  ["settings", "Settings"],
];

export default function ProfileModuleNav() {
  return (
    <nav className="profile-module-nav" aria-label="Candidate profile modules">
      {modules.map(([id, label], index) => (
        <a href={`#${id}`} key={id}>
          <small>{String(index + 1).padStart(2, "0")}</small>{label}
        </a>
      ))}
    </nav>
  );
}
