/**
 * helpers.js — shared utility functions for the AquaCam Connect frontend.
 */

/**
 * Format a number as FCFA currency.
 * @param {number|string} amount
 * @returns {string}  e.g. "FCFA 12,500"
 */
export function formatCurrency(amount) {
    const n = Number(amount) || 0;
    return `FCFA ${n.toLocaleString('en-US')}`;
}

/**
 * Format a date string to a readable local format.
 * @param {string|Date} date
 * @param {object} options — Intl.DateTimeFormat options
 * @returns {string}
 */
export function formatDate(date, options = { year: 'numeric', month: 'short', day: '2-digit' }) {
    if (!date) return '—';
    return new Date(date).toLocaleDateString('en-GB', options);
}

/**
 * Capitalise the first letter of each word and replace underscores with spaces.
 * Useful for displaying role names, statuses, etc.
 * @param {string} str
 * @returns {string}  e.g. "zonal_admin" → "Zonal Admin"
 */
export function humanize(str) {
    if (!str) return '';
    return str
        .replace(/_/g, ' ')
        .replace(/\b\w/g, c => c.toUpperCase());
}

/**
 * Truncate a string to `maxLength` characters, appending "…" if truncated.
 * @param {string} str
 * @param {number} maxLength  (default 40)
 * @returns {string}
 */
export function truncate(str, maxLength = 40) {
    if (!str) return '';
    return str.length > maxLength ? str.slice(0, maxLength) + '…' : str;
}

/**
 * Return a CSS badge class name based on a payment / subscription status string.
 * Mirrors the badge-* utilities defined in index.css.
 * @param {string} status
 * @returns {string}
 */
export function statusBadgeClass(status) {
    const map = {
        paid:        'badge-paid',
        partial:     'badge-partial',
        unpaid:      'badge-unpaid',
        active:      'badge-active',
        operational: 'badge-active',
        inactive:    'badge-inactive',
        pending:     'badge-partial',
        completed:   'badge-paid',
        offline:     'badge-inactive',
    };
    return map[(status || '').toLowerCase()] || 'badge bg-slate-100 text-slate-600';
}

/**
 * Get the current fiscal year.
 * @returns {number}
 */
export function currentYear() {
    return new Date().getFullYear();
}
