import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid,
    Tooltip, ResponsiveContainer
} from 'recharts';

/**
 * RevenueChart — Area chart showing income vs expenditure over multiple years.
 * Props:
 *   data — array of { yr, total_income, total_expenditure }
 */
export default function RevenueChart({ data = [] }) {
    const formatted = data.map(d => ({
        year: String(d.yr),
        Income: Number(d.total_income) || 0,
        Expenditure: Number(d.total_expenditure) || 0,
    }));

    return (
        <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={formatted} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                    <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="expGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.05)" />
                <XAxis
                    dataKey="year"
                    tick={{ fontSize: 11, fontWeight: 700, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                />
                <YAxis
                    tick={{ fontSize: 10, fill: '#94a3b8' }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={v => `${(v / 1000).toFixed(0)}k`}
                />
                <Tooltip
                    contentStyle={{
                        background: '#fff',
                        border: 'none',
                        borderRadius: '16px',
                        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)',
                        fontSize: '12px',
                        fontWeight: 700,
                    }}
                    formatter={(value) => [`FCFA ${Number(value).toLocaleString()}`, undefined]}
                />
                <Area
                    type="monotone"
                    dataKey="Income"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fill="url(#incomeGrad)"
                />
                <Area
                    type="monotone"
                    dataKey="Expenditure"
                    stroke="#ef4444"
                    strokeWidth={2.5}
                    fill="url(#expGrad)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
