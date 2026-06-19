import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Waves, Sun, Moon } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { authAPI } from '../../services/api';
import toast from 'react-hot-toast';

export default function Signup() {
    const navigate = useNavigate();
    const { dark, toggle } = useTheme();
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [zones, setZones] = useState([]);
    const [authError, setAuthError] = useState('');

    const {
        register,
        handleSubmit,
        watch,
        formState: { errors }
    } = useForm();

    useEffect(() => {
        async function loadZones() {
            try {
                const { data } = await authAPI.getPublicZones();
                setZones(data.zones || []);
            } catch (err) {
                console.error('Unable to load zones:', err);
            }
        }
        loadZones();
    }, []);

    const onSubmit = async (formData) => {
        setAuthError('');

        if (formData.password !== formData.confirmPassword) {
            const message = 'Passwords do not match.';
            setAuthError(message);
            toast.error(message);
            return;
        }

        setLoading(true);
        try {
            await authAPI.signup({
                username: formData.username,
                email: formData.email,
                password: formData.password,
                zone_id: formData.zone_id || null
            });
            toast.success('Registration successful. Please sign in.');
            navigate('/login');
        } catch (err) {
            const message = err.response?.data?.error || 'Registration failed. Please try again.';
            setAuthError(message);
            toast.error(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-navy-950 flex items-center justify-center p-4">
            <button
                onClick={toggle}
                className="fixed top-4 right-4 p-2 rounded-xl bg-white dark:bg-navy-800 border border-gray-200 dark:border-navy-600 hover:bg-gray-50 dark:hover:bg-navy-700 transition-colors"
            >
                {dark ? <Sun size={18} className="text-gold-400" /> : <Moon size={18} className="text-gray-600" />}
            </button>

            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-sm"
            >
                <div className="card p-6 shadow-xl text-center">
                    <button
                        type="button"
                        onClick={() => navigate('/')}
                        className="group mx-auto flex flex-col items-center mb-5 focus:outline-none"
                    >
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: 'spring', delay: 0.1 }}
                            className="w-16 h-16 rounded-2xl bg-navy-900 dark:bg-gold-500 flex items-center justify-center mb-4 shadow-lg transition-transform duration-200"
                        >
                            <Waves size={30} className="text-white dark:text-navy-950" />
                        </motion.div>
                        <h1 className="text-2xl font-bold text-navy-900 dark:text-white">AquaCam Connect</h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Water Management System</p>
                    </button>

                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-5">Create your account</h2>

                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-center">
                        {authError && (
                            <div className="rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 px-4 py-3 text-sm font-medium">
                                {authError}
                            </div>
                        )}
                        <div>
                            <label className="label">Username</label>
                            <input
                                {...register('username', { required: 'Username is required' })}
                                className="input"
                                placeholder="Enter your username"
                                autoComplete="username"
                            />
                            {errors.username && (
                                <p className="text-xs text-red-500 mt-1">{errors.username.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="label">Email</label>
                            <input
                                {...register('email', {
                                    required: 'Email is required',
                                    pattern: {
                                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                                        message: 'Invalid email address'
                                    }
                                })}
                                type="email"
                                className="input"
                                placeholder="name@example.com"
                                autoComplete="email"
                            />
                            {errors.email && (
                                <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="label">Password</label>
                            <div className="relative">
                                <input
                                    {...register('password', {
                                        required: 'Password is required',
                                        minLength: { value: 8, message: 'Use at least 8 characters' }
                                    })}
                                    type={showPassword ? 'text' : 'password'}
                                    className="input pr-10"
                                    placeholder="Create a password"
                                    autoComplete="new-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((prev) => !prev)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                </button>
                            </div>
                            {errors.password && (
                                <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
                            )}
                        </div>

                        <div>
                            <label className="label">Confirm password</label>
                            <input
                                {...register('confirmPassword', {
                                    required: 'Please confirm your password',
                                    validate: (value) => value === watch('password') || 'Passwords do not match'
                                })}
                                type={showPassword ? 'text' : 'password'}
                                className="input"
                                placeholder="Confirm your password"
                                autoComplete="new-password"
                            />
                            {errors.confirmPassword && (
                                <p className="text-xs text-red-500 mt-1">{errors.confirmPassword.message}</p>
                            )}
                        </div>

                        {zones.length > 0 && (
                            <div>
                                <label className="label">Zone</label>
                                <select {...register('zone_id')} className="input">
                                    <option value="">Select your zone (optional)</option>
                                    {zones.map((zone) => (
                                        <option key={zone.id} value={zone.id}>{zone.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <motion.button
                            whileTap={{ scale: 0.98 }}
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
                        >
                            {loading ? (
                                <>
                                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    Creating account...
                                </>
                            ) : 'Sign Up'}
                        </motion.button>
                    </form>

                    <p className="mt-5 text-sm text-center text-gray-500 dark:text-gray-400">
                        Already have an account?{' '}
                        <button
                            type="button"
                            onClick={() => navigate('/login')}
                            className="font-semibold text-navy-950 dark:text-gold-400 hover:underline"
                        >
                            Sign in
                        </button>
                    </p>
                </div>

                <p className="text-center text-xs text-gray-400 dark:text-gray-600 mt-6">
                    AquaCam Connect &copy; {new Date().getFullYear()}
                </p>
            </motion.div>
        </div>
    );
}
