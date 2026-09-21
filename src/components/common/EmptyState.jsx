export default function EmptyState({ title, text, className = "empty-state" }) {
  return <section className={className}><h2>{title}</h2>{text ? <p>{text}</p> : null}</section>;
}
