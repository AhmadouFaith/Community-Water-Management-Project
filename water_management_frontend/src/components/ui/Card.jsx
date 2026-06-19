import { motion } from 'framer-motion';

/**
 * Card — glassmorphism container using the .card CSS utility class.
 * Props:
 *   padding   — 'none' | 'sm' | 'md' | 'lg'  (default: 'md')
 *   animate   — whether to apply entrance animation (default: true)
 *   className — extra classes
 *   children  — card content
 */
const paddingClass = {
    none: '',
    sm:   'p-4',
    md:   'p-6 md:p-8',
    lg:   'p-8 md:p-10',
};

export default function Card({
    children,
    padding = 'md',
    animate = true,
    className = '',
    ...props
}) {
    const Wrapper = animate ? motion.div : 'div';
    const animProps = animate
        ? { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4 } }
        : {};

    return (
        <Wrapper
            className={`card ${paddingClass[padding]} ${className}`}
            {...animProps}
            {...props}
        >
            {children}
        </Wrapper>
    );
}
