import { motion } from 'framer-motion';

/**
 * Button — wraps the btn-primary / btn-secondary / btn-danger utility classes.
 * Props:
 *   variant  — 'primary' | 'secondary' | 'danger'  (default: 'primary')
 *   size     — 'sm' | 'md' | 'lg'                  (default: 'md')
 *   loading  — shows a spinner + disables the button
 *   children — button content
 */
const variantClass = {
    primary:   'btn-primary',
    secondary: 'btn-secondary',
    danger:    'btn-danger',
};

const sizeClass = {
    sm: 'px-4 py-1.5 text-xs',
    md: '',          // handled by btn-* class
    lg: 'px-8 py-3.5 text-base',
};

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    className = '',
    ...props
}) {
    return (
        <motion.button
            whileTap={{ scale: 0.97 }}
            disabled={loading || props.disabled}
            className={`${variantClass[variant] ?? 'btn-primary'} ${sizeClass[size]} ${className}`}
            {...props}
        >
            {loading && (
                <div className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" />
            )}
            {children}
        </motion.button>
    );
}
