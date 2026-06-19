import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import {
    Plus, Pencil, Trash2, Droplets, Search, MapPin, Calendar, Info,
    GitBranch, List, Network, Zap, AlertCircle, CheckCircle2, WifiOff
} from 'lucide-react';
import { tapAPI, zoneAPI, tankAPI } from '../../services/api';
import PageHeader from '../../components/ui/PageHeader';
import Modal from '../../components/ui/Modal';
import EmptyState from '../../components/ui/EmptyState';
import Spinner from '../../components/ui/Spinner';
import toast from 'react-hot-toast';

// ─── Network Map Sub-components ──────────────────────────────────────────────

function TapStatusIcon({ status }) {
    if (status === 'active') return <CheckCircle2 size={12} className="text-emerald-500" />;
    if (status === 'maintenance') return <Zap size={12} className="text-amber-500" />;
    return <WifiOff size={12} className="text-slate-400" />;
}

function TapNode({ tap, onEdit, index }) {
    const statusConfig = {
        active:      { bg: 'bg-emerald-50 dark:bg-emerald-500/10', border: 'border-emerald-200 dark:border-emerald-500/20', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
        maintenance: { bg: 'bg-amber-50 dark:bg-amber-500/10',     border: 'border-amber-200 dark:border-amber-500/20',     text: 'text-amber-700 dark:text-amber-400',     dot: 'bg-amber-500'   },
        inactive:    { bg: 'bg-slate-50 dark:bg-white/5',          border: 'border-slate-200 dark:border-white/10',          text: 'text-slate-500 dark:text-slate-400',     dot: 'bg-slate-400'   },
    };
    const cfg = statusConfig[tap.status] || statusConfig.inactive;

    return (
        <motion.div
            initial={{ opacity: 0, x: -6 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.04 }}
            className={`flex items-center gap-3 px-4 py-3 rounded-2xl border ${cfg.bg} ${cfg.border} group hover:shadow-sm transition-all duration-200 cursor-default`}
        >
            {/* Connector dot */}
            <div className="flex items-center gap-2 shrink-0">
                <div className={`w-2 h-2 rounded-full ${cfg.dot} ${tap.status === 'active' ? 'animate-pulse' : ''}`} />
            </div>

            <div className="flex-1 min-w-0">
                <p className={`text-[12px] font-black truncate ${cfg.text}`}>{tap.name}</p>
                {tap.location_description && (
                    <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5 flex items-center gap-1">
                        <MapPin size={8} />
                        {tap.location_description}
                    </p>
                )}
            </div>

            <div className="flex items-center gap-2 shrink-0">
                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
                    {tap.status}
                </span>
                <button
                    onClick={() => onEdit(tap)}
                    className="p-1.5 rounded-xl text-slate-300 hover:text-navy-900 dark:hover:text-gold-400 hover:bg-white dark:hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                >
                    <Pencil size={12} />
                </button>
            </div>
        </motion.div>
    );
}

function TankHubCard({ tank, taps, onEdit, index }) {
    const pct = Math.min(100, Math.round((tank.current_level / tank.capacity_litres) * 100));
    const levelColor = pct > 60 ? 'bg-emerald-500' : pct > 30 ? 'bg-gold-500' : 'bg-rose-500';
    const levelTextColor = pct > 60 ? 'text-emerald-500' : pct > 30 ? 'text-gold-500' : 'text-rose-500';

    const activeTaps = taps.filter(t => t.status === 'active').length;
    const maintenanceTaps = taps.filter(t => t.status === 'maintenance').length;

    return (
        <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="stat-card flex flex-col gap-0 p-0 overflow-hidden"
        >
            {/* Tank Header */}
            <div className="p-6 pb-5">
                <div className="flex items-start justify-between gap-4 mb-5">
                    <div className="flex items-center gap-3">
                        <div className="relative w-11 h-11 rounded-2xl bg-sky-500/10 flex items-center justify-center shrink-0">
                            <Droplets size={20} className="text-sky-500" />
                            <div className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-white dark:bg-navy-900 flex items-center justify-center">
                                <div className={`w-2 h-2 rounded-full ${tank.status === 'active' ? 'bg-emerald-500 animate-pulse' : 'bg-slate-300'}`} />
                            </div>
                        </div>
                        <div>
                            <h3 className="text-[15px] font-black text-navy-950 dark:text-white leading-tight">{tank.name}</h3>
                            <div className="flex items-center gap-1 mt-0.5">
                                <MapPin size={9} className="text-slate-300" />
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">{tank.zone_name}</p>
                            </div>
                        </div>
                    </div>

                    {/* Tap count badge */}
                    <div className="flex flex-col items-end gap-1 shrink-0">
                        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                            <Network size={11} className="text-slate-400" />
                            <span className="text-[11px] font-black text-navy-950 dark:text-white">{taps.length}</span>
                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">taps</span>
                        </div>
                    </div>
                </div>

                {/* Level bar */}
                <div className="p-3.5 rounded-[1.2rem] bg-slate-50/80 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
                    <div className="flex justify-between items-center mb-2">
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Tank Level</span>
                        <span className={`text-[13px] font-black ${levelTextColor}`}>{pct}%</span>
                    </div>
                    <div className="h-2 bg-slate-200/60 dark:bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${pct}%` }}
                            transition={{ duration: 1.2, ease: 'circOut', delay: index * 0.08 + 0.3 }}
                            className={`h-full rounded-full ${levelColor} relative`}
                        >
                            <div className="absolute top-0 right-0 h-full w-3 bg-gradient-to-r from-transparent to-white/30" />
                        </motion.div>
                    </div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mt-1.5">
                        <span>{Number(tank.current_level).toLocaleString()} L</span>
                        <span className="opacity-50">{Number(tank.capacity_litres).toLocaleString()} L cap.</span>
                    </div>
                </div>

                {/* Stats row */}
                <div className="flex items-center gap-3 mt-4">
                    <div className="flex items-center gap-1.5">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">{activeTaps} active</span>
                    </div>
                    {maintenanceTaps > 0 && (
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-amber-500" />
                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">{maintenanceTaps} maint.</span>
                        </div>
                    )}
                    {taps.length - activeTaps - maintenanceTaps > 0 && (
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-slate-300" />
                            <span className="text-[10px] font-black text-slate-500 dark:text-slate-400">{taps.length - activeTaps - maintenanceTaps} offline</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Divider with connector label */}
            <div className="flex items-center gap-3 px-6 py-2.5 bg-slate-50/50 dark:bg-white/[0.02] border-t border-b border-slate-100 dark:border-white/5">
                <GitBranch size={11} className="text-slate-300 dark:text-slate-600 shrink-0" />
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                    Connected Tap Points
                </p>
            </div>

            {/* Taps list */}
            <div className="p-4 flex flex-col gap-2">
                {taps.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-6 gap-2">
                        <AlertCircle size={20} className="text-slate-200 dark:text-slate-600" />
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-300 dark:text-slate-600">
                            No taps connected
                        </p>
                    </div>
                ) : (
                    taps.map((tap, i) => (
                        <TapNode key={tap.id} tap={tap} onEdit={onEdit} index={i} />
                    ))
                )}
            </div>
        </motion.div>
    );
}

function NetworkMapView({ taps, tanks, onEdit }) {
    // Group taps by tank_id
    const tankMap = {};
    tanks.forEach(tank => { tankMap[tank.id] = { tank, taps: [] }; });
    taps.forEach(tap => {
        if (tankMap[tap.tank_id]) {
            tankMap[tap.tank_id].taps.push(tap);
        }
    });

    const groups = Object.values(tankMap);
    const totalActive = taps.filter(t => t.status === 'active').length;
    const totalMaintenance = taps.filter(t => t.status === 'maintenance').length;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
        >
            {/* Map Header Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                    { label: 'Water Tanks', value: tanks.length, color: 'text-sky-500', bg: 'bg-sky-500/10' },
                    { label: 'Total Tap Points', value: taps.length, color: 'text-navy-900 dark:text-gold-400', bg: 'bg-slate-100 dark:bg-white/5' },
                    { label: 'Active Taps', value: totalActive, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
                    { label: 'In Maintenance', value: totalMaintenance, color: 'text-amber-500', bg: 'bg-amber-500/10' },
                ].map(({ label, value, color, bg }) => (
                    <div key={label} className={`${bg} rounded-2xl px-5 py-4 flex flex-col gap-1`}>
                        <p className={`text-2xl font-black ${color}`}>{value}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-slate-400">{label}</p>
                    </div>
                ))}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 px-5 py-3 rounded-2xl bg-white/50 dark:bg-white/5 border border-slate-100 dark:border-white/5">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-slate-400 mr-2">Legend:</p>
                {[
                    { dot: 'bg-sky-500', label: 'Water Tank (Hub)' },
                    { dot: 'bg-emerald-500 animate-pulse', label: 'Active Tap' },
                    { dot: 'bg-amber-500', label: 'Maintenance' },
                    { dot: 'bg-slate-400', label: 'Inactive Tap' },
                ].map(({ dot, label }) => (
                    <div key={label} className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${dot}`} />
                        <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400">{label}</span>
                    </div>
                ))}
            </div>

            {/* Network Grid */}
            {groups.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4">
                    <Network size={40} className="text-slate-200 dark:text-slate-700" />
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">No infrastructure data available</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {groups.map(({ tank, taps: tankTaps }, i) => (
                        <TankHubCard
                            key={tank.id}
                            tank={tank}
                            taps={tankTaps}
                            onEdit={onEdit}
                            index={i}
                        />
                    ))}
                </div>
            )}
        </motion.div>
    );
}

// ─── Main Taps Component ──────────────────────────────────────────────────────

export default function Taps() {
    const [taps, setTaps] = useState([]);
    const [zones, setZones] = useState([]);
    const [tanks, setTanks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [modal, setModal] = useState(false);
    const [editing, setEditing] = useState(null);
    const [deleting, setDeleting] = useState(null);
    const [viewMode, setViewMode] = useState('list'); // 'list' | 'map'

    const { register, handleSubmit, reset, setValue, watch, formState: { errors, isSubmitting } } = useForm();
    const selectedZone = watch('zone_id');

    // Filter tanks by selected zone for cleaner UX
    const filteredTanksForForm = selectedZone
        ? tanks.filter(t => String(t.zone_id) === String(selectedZone))
        : tanks;

    const load = async () => {
        try {
            const [t, z, tnk] = await Promise.all([tapAPI.getAll(), zoneAPI.getAll(), tankAPI.getAll()]);
            setTaps(t.data.taps || []);
            setZones(z.data.zones || []);
            setTanks(tnk.data.tanks || []);
        } catch { toast.error('Failed to load taps'); }
        finally { setLoading(false); }
    };
    useEffect(() => { load(); }, []);

    const openCreate = () => { setEditing(null); reset(); setModal(true); };
    const openEdit = (t) => {
        setEditing(t);
        ['name', 'zone_id', 'tank_id', 'location_description', 'status', 'installed_date']
            .forEach(f => setValue(f, t[f] ?? ''));
        setModal(true);
    };

    const onSubmit = async (data) => {
        try {
            if (editing) { await tapAPI.update(editing.id, data); toast.success('Tap updated'); }
            else { await tapAPI.create(data); toast.success('Tap created'); }
            setModal(false); load();
        } catch (e) { toast.error(e.response?.data?.error || 'Operation failed'); }
    };

    const confirmDelete = async () => {
        try {
            await tapAPI.delete(deleting.id);
            toast.success('Tap deleted'); setDeleting(null); load();
        } catch (e) { toast.error(e.response?.data?.error || 'Cannot delete tap'); }
    };

    const filtered = taps.filter(t =>
        t.name.toLowerCase().includes(search.toLowerCase()) ||
        t.zone_name?.toLowerCase().includes(search.toLowerCase()) ||
        t.tank_name?.toLowerCase().includes(search.toLowerCase())
    );

    return (
        <div className="space-y-8">
            <PageHeader
                title="Tap Network"
                description="Manage and monitor public water access points across the distribution network."
                action={
                    <button onClick={openCreate} className="btn-primary group">
                        <Plus size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                        Provision New Tap
                    </button>
                }
            />

            {/* Controls bar */}
            <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 flex-1 w-full">
                    {/* Search */}
                    <div className="relative w-full md:w-96 group">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-navy-900 dark:group-focus-within:text-gold-500 transition-colors" />
                        <input value={search} onChange={e => setSearch(e.target.value)}
                            placeholder="Search by tap, tank, or zone..."
                            className="input pl-12 bg-white/50 dark:bg-white/5 border-slate-200"
                        />
                    </div>

                    {/* View Mode Toggle */}
                    <div className="flex items-center bg-slate-100/70 dark:bg-white/5 rounded-2xl p-1.5 gap-1 shrink-0">
                        {[
                            { mode: 'list', icon: List, label: 'List' },
                            { mode: 'map',  icon: Network, label: 'Network Map' },
                        ].map(({ mode, icon: Icon, label }) => (
                            <button
                                key={mode}
                                onClick={() => setViewMode(mode)}
                                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                                    viewMode === mode
                                        ? 'bg-navy-900 dark:bg-gold-500 text-white dark:text-navy-950 shadow-lg'
                                        : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-white'
                                }`}
                            >
                                <Icon size={13} />
                                <span className="hidden sm:inline">{label}</span>
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-slate-100/50 dark:bg-white/5 border border-transparent text-[10px] font-black uppercase tracking-widest text-slate-400 shrink-0">
                    <Droplets size={12} className="text-navy-900 dark:text-gold-500" />
                    Access Points: <span className="text-navy-950 dark:text-gold-400 ml-1">{taps.length}</span>
                </div>
            </div>

            {loading ? (
                <div className="flex flex-col items-center justify-center py-32 gap-4">
                    <Spinner size="lg" />
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 animate-pulse">Syncing Network...</p>
                </div>
            ) : (
                <AnimatePresence mode="wait">
                    {viewMode === 'map' ? (
                        <NetworkMapView
                            key="map"
                            taps={taps}
                            tanks={tanks}
                            onEdit={openEdit}
                        />
                    ) : (
                        <motion.div
                            key="list"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            transition={{ duration: 0.25 }}
                        >
                            {filtered.length === 0 ? (
                                <EmptyState icon={Droplets} title="No Taps Found"
                                    description="The tap network is currently empty. Define a new public access point to begin monitoring."
                                    action={<button onClick={openCreate} className="btn-primary"><Plus size={14} />Add Tap Point</button>} />
                            ) : (
                                <motion.div
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="card overflow-hidden"
                                >
                                    <div className="overflow-x-auto">
                                        <table className="w-full">
                                            <thead>
                                                <tr className="table-header">
                                                    <th className="text-left py-5 px-6">Tap Specification</th>
                                                    <th className="text-left py-5 px-6 hidden sm:table-cell">Zone Allocation</th>
                                                    <th className="text-left py-5 px-6 hidden md:table-cell">Connected Tank</th>
                                                    <th className="text-left py-5 px-6 hidden lg:table-cell">Location Notes</th>
                                                    <th className="text-center py-5 px-6">Status</th>
                                                    <th className="py-5 px-6"></th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 dark:divide-white/5">
                                                <AnimatePresence>
                                                    {filtered.map((tap, i) => (
                                                        <motion.tr
                                                            key={tap.id}
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: i * 0.02 }}
                                                            className="table-row group"
                                                        >
                                                            <td className="py-5 px-6">
                                                                <div className="flex items-center gap-4">
                                                                    <div className="w-10 h-10 rounded-[14px] bg-slate-50 dark:bg-white/5 flex items-center justify-center text-slate-400 group-hover:bg-navy-900 group-hover:text-white dark:group-hover:bg-gold-500 dark:group-hover:text-navy-950 transition-all duration-300">
                                                                        <Droplets size={18} />
                                                                    </div>
                                                                    <div>
                                                                        <p className="text-[14px] font-black text-navy-950 dark:text-white leading-tight">
                                                                            {tap.name}
                                                                        </p>
                                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
                                                                            ID: TAP-{tap.id}
                                                                        </p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="py-5 px-6 hidden sm:table-cell">
                                                                <div className="flex items-center gap-2">
                                                                    <MapPin size={12} className="text-slate-300" />
                                                                    <span className="text-[13px] font-bold text-slate-600 dark:text-slate-300">
                                                                        {tap.zone_name}
                                                                    </span>
                                                                </div>
                                                            </td>
                                                            <td className="py-5 px-6 hidden md:table-cell">
                                                                {tap.tank_name ? (
                                                                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-sky-500/10 w-fit">
                                                                        <Droplets size={11} className="text-sky-500" />
                                                                        <span className="text-[12px] font-black text-sky-700 dark:text-sky-400">
                                                                            {tap.tank_name}
                                                                        </span>
                                                                    </div>
                                                                ) : (
                                                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-300">Unassigned</span>
                                                                )}
                                                            </td>
                                                            <td className="py-5 px-6 hidden lg:table-cell">
                                                                <span className="text-[13px] font-medium text-slate-500 dark:text-slate-400">
                                                                    {tap.location_description || <span className="text-[10px] font-black uppercase tracking-widest text-slate-200">No Descriptor</span>}
                                                                </span>
                                                            </td>
                                                            <td className="py-5 px-6 text-center">
                                                                <span className={tap.status === 'active' ? 'badge-active' : 'badge-inactive'}>
                                                                    {tap.status}
                                                                </span>
                                                            </td>
                                                            <td className="py-5 px-6">
                                                                <div className="flex items-center justify-end gap-2">
                                                                    <button onClick={() => openEdit(tap)}
                                                                        className="p-2.5 rounded-xl text-slate-400 hover:text-navy-950 dark:hover:text-gold-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                                                                        <Pencil size={18} />
                                                                    </button>
                                                                    <button onClick={() => setDeleting(tap)}
                                                                        className="p-2.5 rounded-xl text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all">
                                                                        <Trash2 size={18} />
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </motion.tr>
                                                    ))}
                                                </AnimatePresence>
                                            </tbody>
                                        </table>
                                    </div>
                                </motion.div>
                            )}
                        </motion.div>
                    )}
                </AnimatePresence>
            )}

            {/* Create/Edit Modal */}
            <Modal open={modal} onClose={() => setModal(false)}
                title={editing ? 'Revise Tap Configuration' : 'Provision New Tap Point'} size="lg">
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        {/* Name */}
                        <div>
                            <label className="label">Unit Designation *</label>
                            <input {...register('name', { required: 'Name is required' })}
                                className="input" placeholder="e.g. Lower Market Tap A" />
                            {errors.name && <p className="text-[10px] font-black text-rose-500 mt-2 px-1 uppercase tracking-wider">{errors.name.message}</p>}
                        </div>

                        {/* Zone */}
                        <div>
                            <label className="label">Allocation Sector *</label>
                            <div className="relative">
                                <MapPin size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <select {...register('zone_id', { required: 'Zone is required' })} className="input pl-11">
                                    <option value="">Select allocation sector...</option>
                                    {zones.map(z => <option key={z.id} value={z.id}>{z.name}</option>)}
                                </select>
                            </div>
                            {errors.zone_id && <p className="text-[10px] font-black text-rose-500 mt-2 px-1 uppercase tracking-wider">{errors.zone_id.message}</p>}
                        </div>

                        {/* Tank — required field, filtered by zone */}
                        <div>
                            <label className="label">Source Tank *</label>
                            <div className="relative">
                                <Droplets size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-400" />
                                <select {...register('tank_id', { required: 'Source tank is required' })} className="input pl-11">
                                    <option value="">Select supply tank...</option>
                                    {filteredTanksForForm.map(t => (
                                        <option key={t.id} value={t.id}>{t.name} ({t.zone_name})</option>
                                    ))}
                                </select>
                            </div>
                            {errors.tank_id && <p className="text-[10px] font-black text-rose-500 mt-2 px-1 uppercase tracking-wider">{errors.tank_id.message}</p>}
                            {selectedZone && filteredTanksForForm.length === 0 && (
                                <p className="text-[10px] font-black text-amber-500 mt-2 px-1 uppercase tracking-wider">No tanks in this zone yet</p>
                            )}
                        </div>

                        {/* Status */}
                        <div>
                            <label className="label">Operational Status</label>
                            <select {...register('status')} className="input">
                                <option value="active">Operational</option>
                                <option value="inactive">Decoupled</option>
                                <option value="maintenance">Maintenance Cycle</option>
                            </select>
                        </div>

                        {/* Installation Date */}
                        <div>
                            <label className="label">Installation Date</label>
                            <div className="relative">
                                <Calendar size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input {...register('installed_date')} type="date" className="input pl-11" />
                            </div>
                        </div>

                        {/* Location */}
                        <div>
                            <label className="label">Locality Descriptor</label>
                            <div className="relative">
                                <Info size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                                <input {...register('location_description')} className="input pl-11"
                                    placeholder="e.g. Opposite community hall, North entrance" />
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-4 pt-6 border-t border-slate-50 dark:border-white/5">
                        <button type="button" onClick={() => setModal(false)} className="btn-secondary flex-1">Abort</button>
                        <button type="submit" disabled={isSubmitting} className="btn-primary flex-1">
                            {isSubmitting ? 'Syncing...' : editing ? 'Commit Specs' : 'Authorize Provisioning'}
                        </button>
                    </div>
                </form>
            </Modal>

            {/* Delete Confirm */}
            <Modal open={!!deleting} onClose={() => setDeleting(null)} title="Revoke Provisioning" size="sm">
                <div className="p-4 space-y-6 text-center">
                    <div className="p-5 rounded-[2rem] bg-rose-50 dark:bg-rose-500/10 border border-rose-100 dark:border-rose-500/20">
                        <p className="text-[13px] font-bold text-rose-700 dark:text-rose-400 leading-relaxed">
                            Confirm revocation of provisioning for:<br/>
                            <span className="text-lg font-black block mt-2">{deleting?.name}</span>
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button onClick={() => setDeleting(null)} className="btn-secondary flex-1 font-black uppercase tracking-widest text-[11px]">Abort</button>
                        <button onClick={confirmDelete} className="btn-danger flex-1 font-black uppercase tracking-widest text-[11px]">Confirm Delete</button>
                    </div>
                </div>
            </Modal>
        </div>
    );
}