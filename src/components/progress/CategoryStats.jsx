export default function CategoryStats({ items }) {
  return <div className="progress-card"><h2>Tareas por categoría</h2>{items.map((item) => <div className="category-row" key={item.category}><span>{item.category}</span><strong>{item.count}</strong></div>)}</div>;
}
