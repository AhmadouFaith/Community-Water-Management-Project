import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Waves, ArrowLeft } from 'lucide-react';

export default function NotFound() {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#050816] flex flex-col items-center justify-center p-6 text-center">
            {/* Decorative glows */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-navy-900/5 dark:bg-gold-500/[0.04] rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/5 dark:bg-navy-900/10 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="relative z-10 max-w-md"
            >
                {/* Logo */}
                <div className="flex justify-center mb-8">
                    <div className="w-16 h-16 rounded-2xl bg-navy-900 dark:bg-gold-500 flex items-center justify-center shadow-2xl">
                        <Waves size={30} className="text-white dark:text-navy-950" />
                    </div>
                </div>

                {/* 404 number */}
                <h1 className="text-[8rem] font-black leading-none tracking-tighter text-navy-950 dark:text-white opacity-10 select-none">
                    404
                </h1>

                <div className="-mt-8 mb-6">
                    <h2 className="text-2xl font-black text-navy-950 dark:text-white tracking-tight mb-2">
                        Page not found
                    </h2>
                    <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                        The page you're looking for doesn't exist or has been moved.
                    </p>
                </div>

                <Link
                    to="/dashboard"
                    className="btn-primary inline-flex mx-auto"
                >
                    <ArrowLeft size={16} />
                    Back to Dashboard
                </Link>
            </motion.div>
        </div>
    );
}
