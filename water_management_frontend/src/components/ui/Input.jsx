/**
 * Input — wraps the .input and .label CSS utility classes.
 * Can be used standalone or with react-hook-form via {...register('field')}.
 * Props:
 *   label     — optional label text
 *   error     — error message string
 *   className — extra classes applied to the <input>
 */
import { forwardRef } from 'react';

const Input = forwardRef(function Input(
    { label, error, className = '', id, ...props },
    ref
) {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
        <div className="space-y-1">
            {label && (
                <label htmlFor={inputId} className="label">
                    {label}
                </label>
            )}
            <input
                id={inputId}
                ref={ref}
                className={`input ${error ? 'ring-2 ring-rose-500 focus:ring-rose-500' : ''} ${className}`}
                {...props}
            />
            {error && (
                <p className="text-xs text-rose-500 mt-1 ml-1">{error}</p>
            )}
        </div>
    );
});

export default Input;
