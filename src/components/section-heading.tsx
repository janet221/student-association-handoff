export function SectionHeading({ number, label, title, description }: { number: string; label: string; title: string; description?: string }) {
  return (
    <div className="section-heading">
      <div className="section-number">{number} <span /> {label}</div>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
  );
}
