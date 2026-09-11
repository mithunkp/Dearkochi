'use client';

import React, { useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/cn';

/* 48px controls with 16px text: large enough to tap, and big enough that
   iOS Safari does not zoom the viewport when they receive focus. */
const CONTROL =
    'h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-[16px] text-foreground placeholder:text-faint focus:border-primary focus:outline-none disabled:opacity-60';

type FieldProps = {
    label: string;
    hint?: string;
    error?: string;
    required?: boolean;
    children: (id: string) => React.ReactNode;
    className?: string;
};

/** Label + control + hint/error, wired together with a generated id. */
export function Field({
    label,
    hint,
    error,
    required,
    children,
    className,
}: FieldProps) {
    const id = useId();
    return (
        <div className={className}>
            <label
                htmlFor={id}
                className="mb-1.5 block text-[13px] font-semibold text-foreground"
            >
                {label}
                {required && <span className="ml-0.5 text-danger">*</span>}
            </label>
            {children(id)}
            {error ? (
                <p role="alert" className="mt-1.5 text-xs font-medium text-danger">
                    {error}
                </p>
            ) : hint ? (
                <p className="mt-1.5 text-xs text-faint">{hint}</p>
            ) : null}
        </div>
    );
}

export function TextInput({
    className,
    ...props
}: React.InputHTMLAttributes<HTMLInputElement>) {
    return <input {...props} className={cn(CONTROL, className)} />;
}

export function TextArea({
    className,
    ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
    return (
        <textarea
            {...props}
            className={cn(CONTROL, 'h-auto resize-none py-3', className)}
        />
    );
}

export function Select({
    className,
    children,
    ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
    return (
        <div className="relative">
            <select
                {...props}
                className={cn(CONTROL, 'appearance-none pr-10', className)}
            >
                {children}
            </select>
            <ChevronDown
                size={17}
                className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-faint"
            />
        </div>
    );
}
