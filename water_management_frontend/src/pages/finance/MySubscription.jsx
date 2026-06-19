import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    CreditCard, Download, CheckCircle2, Clock, AlertCircle,
    Plus, X, FileText, Receipt, Sparkles, Info
} from 'lucide-react';
import { subscriptionAPI, paymentAPI, reportAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import Spinner from '../../components/ui/Spinner';
import PageHeader from '../../components/ui/PageHeader';
import toast from 'react-hot-toast';

const currentYear = new Date().getFullYear();
const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

export default function MySubscription() {
    const { user } = useAuth();
    // Only 'representative' can create subscriptions and make payments
    const canTransact = user?.role === 'representative';
    const [subscription, setSubscription] = useState(null);
    const [payments, setPayments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [year, setYear] = useState(currentYear);

    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentAmount, setPaymentAmount] = useState('');
    const [paymentPlan, setPaymentPlan] = useState('yearly');
    const [paymentLoading, setPaymentLoading] = useState(false);
    const [isNewSubscription, setIsNewSubscription] = useState(false);

    // Receipt state — stores the last completed payment id for instant download
    const [lastPaymentId, setLastPaymentId] = useState(null);
    const [showReceiptBanner, setShowReceiptBanner] = useState(false);

    const loadData = async () => {
        setLoading(true);
        try {
            if (!user?.household_id) return;
            const s = await subscriptionAPI.getByHousehold(user.household_id);
            const subs = s.data.subscriptions || [];
            const currentSub = subs.find(sub => sub.year == year);
            setSubscription(currentSub || null);

            if (currentSub) {
                const p = await paymentAPI.getBySubscription(currentSub.id);
                setPayments(p.data.payments || []);
            } else {
                setPayments([]);
            }
        } catch { }
        finally { setLoading(false); }
    };

    useEffect(() => {
        loadData();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [year, user]);

    // Clear receipt banner when year changes
    useEffect(() => {
        setLastPaymentId(null);
        setShowReceiptBanner(false);
    }, [year]);

    const handleOpenPayment = (isNew) => {
        setIsNewSubscription(isNew);
        setPaymentPlan('yearly');
        setPaymentAmount(subscription ? subscription.balance : '');
        setShowPaymentModal(true);
    };

    const handleSubscribeNow = async () => {
        setLoading(true);
        try {
            await subscriptionAPI.create({
                household_id: user.household_id,
                year: year
            });
            const s = await subscriptionAPI.getByHousehold(user.household_id);
            const currentSub = s.data.subscriptions?.find(sub => sub.year == year);
            setSubscription(currentSub || null);
            setIsNewSubscription(true);
            setPaymentPlan('yearly');
            setPaymentAmount(currentSub ? currentSub.balance : '');
            setShowPaymentModal(true);
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to subscribe.');
        } finally {
            setLoading(false);
        }
    };

    // Recalculate amount when plan changes
    useEffect(() => {
        if (!subscription || !showPaymentModal) return;
        if (paymentPlan === 'yearly') {
            setPaymentAmount(subscription.balance);
        } else if (paymentPlan === 'monthly') {
            const monthlyAmount = Math.ceil(subscription.amount_due / 12);
            setPaymentAmount(Math.min(monthlyAmount, subscription.balance));
        } else {
            setPaymentAmount('');
        }
    }, [paymentPlan, subscription, showPaymentModal]);

    const submitPayment = async (e) => {
        e.preventDefault();
        setPaymentLoading(true);
        try {
            const res = await paymentAPI.initiateFapshiPayment({
                subscription_id: subscription.id,
                amount: Number(paymentAmount),
            });

            if (res.data?.link) {
                // Redirect user to Fapshi payment gateway
                window.location.href = res.data.link;
            } else {
                toast.error('Could not initiate payment.');
            }
        } catch (err) {
            toast.error(err.response?.data?.error || 'Failed to process payment.');
            setPaymentLoading(false);
        }
    };

    const downloadReceipt = (paymentId) => {
        window.open(reportAPI.paymentReceipt(paymentId), '_blank');
    };

    const StatusIcon = () => {
        if (!subscription) return null;
        if (subscription.status === 'paid') return <CheckCircle2 className="text-green-500" size={40} />;
        if (subscription.status === 'partial') return <Clock className="text-yellow-500" size={40} />;
        return <AlertCircle className="text-red-500" size={40} />;
    };

    return (
        <div>
            <PageHeader
                title="My Subscription"
                description="View your household subscription, make payments, and download receipts"
            />

            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6">
                <div className="flex items-center gap-3">
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-200">Year:</label>
                    <select value={year} onChange={e => setYear(Number(e.target.value))} className="input w-28">
                        {years.map(y => <option key={y} value={y}>{y}</option>)}
                    </select>
                </div>
            </div>

            {/* ── Receipt-ready banner (shown immediately after payment) ── */}
            <AnimatePresence>
                {showReceiptBanner && lastPaymentId && (
                    <motion.div
                        initial={{ opacity: 0, y: -12, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -12, scale: 0.97 }}
                        transition={{ type: 'spring', stiffness: 300, damping: 24 }}
                        className="mb-5 flex flex-col sm:flex-row items-center gap-4 p-5 rounded-2xl
                                   bg-emerald-50 dark:bg-emerald-500/10
                                   border border-emerald-200 dark:border-emerald-500/30
                                   shadow-lg shadow-emerald-100 dark:shadow-emerald-900/20"
                    >
                        {/* Animated icon */}
                        <div className="flex-shrink-0 w-12 h-12 rounded-2xl bg-emerald-500 flex items-center justify-center shadow-md shadow-emerald-500/30">
                            <motion.div
                                initial={{ scale: 0, rotate: -15 }}
                                animate={{ scale: 1, rotate: 0 }}
                                transition={{ delay: 0.1, type: 'spring', stiffness: 400, damping: 20 }}
                            >
                                <Receipt size={22} className="text-white" />
                            </motion.div>
                        </div>

                        <div className="flex-1 text-center sm:text-left">
                            <div className="flex items-center justify-center sm:justify-start gap-2 mb-0.5">
                                <p className="text-sm font-black text-emerald-800 dark:text-emerald-300">
                                    Payment Successful — Your Receipt is Ready
                                </p>
                                <Sparkles size={14} className="text-emerald-500" />
                            </div>
                            <p className="text-xs text-emerald-600 dark:text-emerald-400">
                                Download your official payment receipt generated by JasperReports.
                            </p>
                        </div>

                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => downloadReceipt(lastPaymentId)}
                                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700
                                           text-white text-sm font-bold transition-all duration-200
                                           shadow-md shadow-emerald-500/30 hover:shadow-emerald-500/50 hover:-translate-y-0.5"
                            >
                                <Download size={15} />
                                Download Receipt
                            </button>
                            <button
                                onClick={() => setShowReceiptBanner(false)}
                                className="p-2 rounded-xl text-emerald-500 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition-colors"
                            >
                                <X size={16} />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {loading ? (
                <div className="flex justify-center py-20"><Spinner /></div>
            ) : !subscription ? (
                <div className="card p-8 text-center">
                    <CreditCard size={40} className="mx-auto text-gray-300 mb-3" />
                    <p className="text-gray-500 dark:text-gray-300 mb-6">No subscription found for {year}.</p>
                    {canTransact ? (
                        <button
                            onClick={handleSubscribeNow}
                            className="btn-primary inline-flex items-center gap-2"
                        >
                            <Plus size={18} /> Subscribe Now
                        </button>
                    ) : (
                        <div className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-slate-400 text-sm">
                            <Info size={15} />
                            Contact your household representative to subscribe.
                        </div>
                    )}
                </div>
            ) : (
                <div className="space-y-4">

                    {/* Status card */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        className="card p-6 flex flex-col sm:flex-row items-center gap-6">
                        <StatusIcon />
                        <div className="flex-1 text-center sm:text-left">
                            <p className="text-2xl font-bold text-gray-900 dark:text-white capitalize">
                                {subscription.status}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-300">
                                Subscription status for {year}
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-3 justify-center">
                            {canTransact && subscription.balance > 0 && (
                                <button
                                    onClick={() => handleOpenPayment(false)}
                                    className="btn-primary flex items-center gap-2">
                                    <CreditCard size={15} /> Make Payment
                                </button>
                            )}
                            <button
                                onClick={() => window.open(reportAPI.subscriptionStatement(user.household_id, year), '_blank')}
                                className="btn-secondary flex items-center gap-2">
                                <FileText size={15} /> Annual Statement
                            </button>
                        </div>
                    </motion.div>

                    {/* Details */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }} className="card p-5">
                        <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-4">
                            Subscription Details
                        </h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: 'Members', value: subscription.member_count },
                                { label: 'Rate/Person', value: `FCFA ${Number(subscription.rate_per_person).toLocaleString()}` },
                                { label: 'Amount Due', value: `FCFA ${Number(subscription.amount_due).toLocaleString()}` },
                                { label: 'Amount Paid', value: `FCFA ${Number(subscription.amount_paid || 0).toLocaleString()}` },
                            ].map(({ label, value }) => (
                                <div key={label} className="text-center p-3 bg-gray-50 dark:bg-navy-800 rounded-xl">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white">{value}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{label}</p>
                                </div>
                            ))}
                        </div>
                        {subscription.balance > 0 && (
                            <div className="mt-4 p-3 bg-red-50 dark:bg-red-900/20 rounded-xl">
                                <p className="text-sm font-semibold text-red-700 dark:text-red-400">
                                    Outstanding Balance: FCFA {Number(subscription.balance).toLocaleString()}
                                </p>
                            </div>
                        )}
                    </motion.div>

                    {/* Payment history */}
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }} className="card overflow-hidden">
                        <div className="px-5 py-4 border-b border-gray-100 dark:border-navy-700 flex items-center justify-between">
                            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                                Payment History
                            </h3>
                            {payments.length > 0 && (
                                <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                                    {payments.length} payment{payments.length !== 1 ? 's' : ''}
                                </span>
                            )}
                        </div>
                        {payments.length === 0 ? (
                            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-8">
                                No payments recorded for {year}.
                            </p>
                        ) : (
                            <table className="w-full text-sm">
                                <thead>
                                    <tr className="table-header">
                                        <th className="text-left px-4 py-3">Date</th>
                                        <th className="text-right px-4 py-3">Amount (FCFA)</th>
                                        <th className="text-left px-4 py-3 hidden sm:table-cell">Method</th>
                                        <th className="text-left px-4 py-3 hidden md:table-cell">Reference</th>
                                        <th className="text-center px-4 py-3">Receipt</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {payments.map((p) => (
                                        <motion.tr
                                            key={p.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className={`table-row ${p.id === lastPaymentId ? 'bg-emerald-50/50 dark:bg-emerald-500/5' : ''}`}
                                        >
                                            <td className="px-4 py-3 text-gray-700 dark:text-gray-300">
                                                {p.payment_date}
                                                {p.id === lastPaymentId && (
                                                    <span className="ml-2 badge-paid text-[9px]">New</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                                                {Number(p.amount).toLocaleString()}
                                            </td>
                                            <td className="px-4 py-3 text-gray-500 dark:text-gray-400 capitalize hidden sm:table-cell">
                                                {p.payment_method?.replace('_', ' ')}
                                            </td>
                                            <td className="px-4 py-3 text-gray-400 dark:text-gray-500 hidden md:table-cell">
                                                {p.reference_number || p.reference || '—'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => downloadReceipt(p.id)}
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
                        )}
                    </motion.div>
                </div>
            )}

            {/* Payment Modal */}
            <AnimatePresence>
                {showPaymentModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/40 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white dark:bg-navy-900 rounded-3xl p-6 w-full max-w-md shadow-2xl relative"
                        >
                            <button
                                onClick={() => setShowPaymentModal(false)}
                                className="absolute top-4 right-4 p-2 rounded-xl hover:bg-gray-100 dark:hover:bg-navy-800 text-gray-400"
                            >
                                <X size={20} />
                            </button>

                            <div className="flex items-center gap-3 mb-2">
                                <div className="w-10 h-10 rounded-2xl bg-navy-900 dark:bg-gold-500 flex items-center justify-center">
                                    <CreditCard size={18} className="text-white dark:text-navy-950" />
                                </div>
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                                    {isNewSubscription ? 'Subscribe & Pay' : 'Make Payment'}
                                </h2>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
                                Enter the amount you wish to pay towards your {year} subscription.
                                {!isNewSubscription && subscription?.balance > 0 && (
                                    <span className="block mt-1 font-semibold text-red-500">
                                        Current balance: FCFA {Number(subscription.balance).toLocaleString()}
                                    </span>
                                )}
                            </p>

                            {/* Receipt notice */}
                            <div className="flex items-center gap-2 px-4 py-2.5 mb-5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20">
                                <Receipt size={14} className="text-emerald-600 dark:text-emerald-400 flex-shrink-0" />
                                <p className="text-xs text-emerald-700 dark:text-emerald-400 font-medium">
                                    A downloadable receipt will be generated instantly after payment.
                                </p>
                            </div>

                            <form onSubmit={submitPayment} className="space-y-4">
                                <div className="space-y-2">
                                    <label className="label">Payment Plan</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {['yearly', 'monthly', 'custom'].map(plan => {
                                            let displayLabel = plan;
                                            if (plan === 'yearly') displayLabel = 'Entire Year';
                                            if (plan === 'monthly') displayLabel = 'Month in Advance';
                                            if (plan === 'custom') displayLabel = 'Custom Amount';
                                            
                                            return (
                                                <label
                                                    key={plan}
                                                    className={`cursor-pointer flex items-center justify-center p-3 rounded-xl border text-sm font-medium capitalize transition-all ${
                                                        paymentPlan === plan
                                                            ? 'border-navy-900 bg-navy-900/5 dark:border-gold-500 dark:bg-gold-500/10 text-navy-900 dark:text-gold-400'
                                                            : 'border-gray-200 dark:border-navy-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-navy-800'
                                                    }`}
                                                >
                                                    <input
                                                        type="radio"
                                                        name="paymentPlan"
                                                        value={plan}
                                                        checked={paymentPlan === plan}
                                                        onChange={() => setPaymentPlan(plan)}
                                                        className="sr-only"
                                                    />
                                                    {displayLabel}
                                                </label>
                                            )
                                        })}
                                    </div>
                                </div>

                                <div>
                                    <label className="label">Amount (FCFA)</label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={subscription?.balance}
                                        required
                                        value={paymentAmount}
                                        onChange={e => {
                                            setPaymentAmount(e.target.value);
                                            if (paymentPlan !== 'custom') setPaymentPlan('custom');
                                        }}
                                        className="input"
                                        placeholder="Enter amount"
                                    />
                                    {paymentPlan === 'monthly' && (
                                        <p className="text-xs text-gray-500 mt-1">Calculated as Total Amount Due ÷ 12</p>
                                    )}
                                </div>
                                <button
                                    type="submit"
                                    disabled={paymentLoading}
                                    className="btn-primary w-full"
                                >
                                    {paymentLoading ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                            Processing...
                                        </span>
                                    ) : 'Confirm Payment'}
                                </button>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}