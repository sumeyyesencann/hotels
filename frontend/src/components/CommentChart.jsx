import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Cell } from 'recharts';

export default function CommentChart({ stats }) {
  if (!stats || stats.count === 0) return <p>Henüz yorum yok.</p>;

  const data = Object.entries(stats.categories || {}).map(([name, value]) => ({ name, value }));

  return (
    <div>
      <h3 style={{ marginBottom: '8px' }}>{stats.overall_avg}/10 — {stats.count} Yorum</h3>
      <BarChart width={500} height={260} data={data} layout="vertical">
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis type="number" domain={[0, 10]} />
        <YAxis type="category" dataKey="name" width={160} />
        <Tooltip />
        <Bar dataKey="value" fill="#cc0000">
          {data.map((_, i) => <Cell key={i} fill="#cc0000" />)}
        </Bar>
      </BarChart>
    </div>
  );
}
