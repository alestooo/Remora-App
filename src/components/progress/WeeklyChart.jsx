export default function WeeklyChart({ weeklyStats, maxWeekly }) {
  return <div className="progress-card"><h2>Gráfico semanal</h2><div className="weekly-chart">{weeklyStats.map((item) => <div className="bar-item" key={item.label}><div className="bar" style={{ height: `${(item.count / maxWeekly) * 120 + 12}px` }} /><span>{item.label}</span><small>{item.count}</small></div>)}</div></div>;
}
