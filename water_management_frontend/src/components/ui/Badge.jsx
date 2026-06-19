/**
 * Badge — status chip using the CSS badge utility classes from index.css
 * Usage: <Badge status="paid" /> or <Badge variant="active" label="Online" />
 */

const variantMap = {
    paid:       'badge-paid',
    partial:    'badge-partial',
    unpaid:     'badge-unpaid',
    active:     'badge-active',
    inactive:   'badge-inactive',
    operational:'badge-active',
    offline:    'badge-inactive',
    pending:    'badge-partial',
    completed:  'badge-paid',
};

export default function Badge({ status, variant, label, className = '' }) {
    const key = (status || variant || '').toLowerCase();
    const cls = variantMap[key] || 'badge bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-400';
    const text = label || status || variant || '';
    return (
        <span className={`${cls} ${className}`}>
            {text}
        </span>
    );
}
