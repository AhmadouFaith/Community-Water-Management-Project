import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { Plus, ReceiptText, Search, Download } from 'lucide-react';
import { paymentAPI, subscriptionAPI, committeeAPI, reportAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

export default function Payments() {
    const [payments, setPayments] = useState([]);
    const [subscriptions, setSubscriptions] = useState([]);
    const [committee, setCommittee] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(false);

    const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm();

    const load = async () => {
        try {
            const [p, s, c] = await Promise.all([
                paymentAPI.getAll(),
                subscriptionAPI.getAll(),
                committeeAPI.getAll(),
            ]);
            setPayments(p.data.payments || []);
            setSubscriptions(s.data.subscriptions || []);
            setCommittee(c.data.committee || []);
        } catch { toast.error('Failed to load payments'); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const onSubmit = async (data) => {
        try {
            await paymentAPI.create(data);
            toast.success('Payment recorded');
            setModal(false); reset(); load();
        } catch (e) { toast.error(e.response?.data?.error || 'Failed'); }
    };

    const filtered = payments.filter(p =>
        `${p.household_address} ${p.payment_method} ${p.zone_name || ''}`
            .toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div>
            <PageHeader
                title="Subscription Payments"
                description="Record and view household subscription payments"
                action={
                    <button onClick={() => { reset(); setModal(true); }}
                        className="btn-primary flex items-center gap-2">
                        <Plus size={16} /> Record Payment
                    </button>
                }
            />

            <div className="relative mb-4">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search payments..." className="input pl-9" />
            </div>

            {loading ? <div className="flex justify-center py-20"><Spinner /></div>
                : filtered.length === 0 ? (
                    <EmptyState icon={ReceiptText} title="No payments found"
                        description="Record the first payment." />
                ) : (
                    <div className="card overflow-hidden">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="table-header">
                                    <th className="text-left px-4 py-3">Household</th>
                                    <th className="text-left px-4 py-3 hidden sm:table-cell">Date</th>
                                    <th className="text-right px-4 py-3">Amount (FCFA)</th>
                                    <th className="text-left px-4 py-3 hidden md:table-cell">Method</th>
                                    <th className="text-left px-4 py-3 hidden lg:table-cell">Reference</th>
                                    <th className="text-left px-4 py-3 hidden xl:table-cell">Received By</th>
                                    <th className="text-center px-4 py-3">Receipt</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((p, i) => (
                                    <motion.tr key={p.id}
                                        initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                                        transition={{ delay: i * 0.03 }} className="table-row">
                                        <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">
                                            {p.household_address}
                                            <p className="text-xs text-gray-400 dark:text-gray-500">{p.zone_name} · {p.year}</p>
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-300 hidden sm:table-cell">
                                            {p.payment_date}
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                                            {Number(p.amount).toLocaleString()}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-300 capitalize hidden md:table-cell">
                                            {p.payment_method?.replace('_', ' ')}
                                        </td>
                                        <td className="px-4 py-3 text-gray-400 dark:text-gray-500 hidden lg:table-cell">
                                            {p.reference || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-gray-500 dark:text-gray-300 hidden xl:table-cell">
                                            {p.received_by_name || '—'}
                                        </td>
                                        <td className="px-4 py-3 text-center">
                                            <button
                                                onClick={() => window.open(reportAPI.paymentReceipt(p.id), '_blank')}
                                                title="Download Payment Receipt"
                                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                                                           text-xs font-bold
                                                           bg-navy-50 dark:bg-white/5
                                                           text-navy-900 dark:text-gold-400
                                                           border border-navy-100 dark:border-white/10
                                                           hover:bg-navy-900 hover:text-white
                                                           dark:hover:bg-gold-500 dark:hover:text-navy-950
                                                           transition-all duration-200 group"
                                            >
                                                <Download size={12} className="group-hover:-translate-y-0.5 transition-transform" />
                                                Receipt
                                            </button>
                                        </td>
                                    </motion.tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}

            <Modal open={modal} onClose={() => setModal(false)} title="Record Payment" size="lg">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="sm:col-span-2">
                            <label className="label">Subscription *</label>
                            <select {...register('subscription_id', { required: 'Required' })} className="input">
                                <option value="">Select subscription</option>
                                {subscriptions.filter(s => s.status !== 'paid').map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.household_address} — {s.year} (Balance: {Number(s.balance || 0).toLocaleString()} FCFA)
                                    </option>
                                ))}
                            </select>
                            {errors.subscription_id && <p className="text-xs text-red-500 mt-1">{errors.subscription_id.message}</p>}
                        </div>
                        <div>
                            <label className="label">Amount (FCFA) *</label>
                            <input {...register('amount', { required: 'Required', min: 1 })}
                                type="number" className="input" placeholder="Enter amount" />
                            {errors.amount && <p className="text-xs text-red-500 mt-1">Amount is required</p>}
                        </div>
                        <div>
                            <label className="label">Payment Date *</label>
                            <input {...register('payment_date', { required: 'Required' })}
                                type="date" className="input" defaultValue={new Date().toISOString().split('T')[0]} />
                        </div>
                        <div>
                            <label className="label">Payment Method</label>
                            <select {...register('payment_method')} className="input">
                                <option value="cash">Cash</option>
                                <option value="mobile_money">Mobile Money</option>
                                <option value="bank_transfer">Bank Transfer</option>
                            </select>
                        </div>
                        <div>
                            <label className="label">Reference / Receipt No.</label>
                            <input {...register('reference')} className="input" placeholder="Optional" />
                        </div>
                        <div className="sm:col-span-2">
                            <label className="label">Received By (Committee Member)</label>
                            <select {...register('received_by')} className="input">
                                <option value="">Select member (optional)</option>
                                {committee.map(c => (
                                    <option key={c.id} value={c.id}>
                                        {c.first_name} {c.last_name} — {c.role}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="sm:col-span-2">
                            <label className="label">Notes</label>
                            <input {...register('notes')} className="input" placeholder="Optional notes..." />
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                            {isSubmitting ? 'Saving...' : 'Record Payment'}
                        </button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}