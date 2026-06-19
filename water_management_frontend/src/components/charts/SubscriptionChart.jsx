import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

/**
 * SubscriptionChart — Donut chart showing paid / partial / unpaid subscription counts.
 * Props:
 *   paid    — number of fully paid subscriptions
 *   partial — number of partial subscriptions
 *   unpaid  — number of unpaid subscriptions
 */
const COLORS = ['#10b981', '#FFB800', '#ef4444'];
const LABELS = ['Fully Paid', 'Partial', 'Unpaid'];

export default function SubscriptionChart({ paid = 0, partial = 0, unpaid = 0 }) {
    const data = [
        { name: LABELS[0], value: paid },
        { name: LABELS[1], value: partial },
        { name: LABELS[2], value: unpaid },
    ].filter(d => d.value > 0);

    if (data.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-sm text-slate-400 font-medium">
                No subscription data
            </div>
        );
    }

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={5}
                    dataKey="value"
                    stroke="none"
                >
                    {data.map((entry, index) => (
                        <Cell
                            key={`cell-${index}`}
                            fill={COLORS[LABELS.indexOf(entry.name)]}
                            className="focus:outline-none"
                        />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{
                        background: '#fff',
                        border: 'none',
                        borderRadius: '16px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                        fontSize: '12px',
                        fontWeight: 700,
                    }}
                />
                <Legend
                    verticalAlign="bottom"
                    height={36}
                    iconType="circle"
                    iconSize={8}
                    formatter={(value) => (
                        <span className="text-[11px] font-black uppercase tracking-widest text-slate-500 ml-1">
                            {value}
                        </span>
                    )}
                />
            </PieChart>
        </ResponsiveContainer>
    );
}
