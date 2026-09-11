'use client';

import React from 'react';
import Link from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/cn';

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';
type Size = 'sm' | 'md' | 'lg';

const VARIANTS: Record<Variant, string> = {
    primary:
        'bg-primary text-primary-foreground hover:bg-primary-hover shadow-e1',
    secondary:
        'bg-surface-2 text-foreground border border-line hover:bg-surface-3',
    ghost: 'text-foreground hover:bg-surface-2',
    danger: 'bg-danger text-white hover:brightness-110 shadow-e1',
};

/* md and lg clear the 44px minimum touch target; sm is for dense desktop
   toolbars and inline chips only. */
const SIZES: Record<Size, string> = {
    sm: 'h-9 gap-1.5 rounded-lg px-3 text-[13px]',
    md: 'h-11 gap-2 rounded-xl px-4 text-sm',
    lg: 'h-13 gap-2 rounded-xl px-5 text-base',
};

type StyleProps = {
    variant?: Variant;
    size?: Size;
    /** Stretch to the container — the default shape for mobile forms. */
    block?: boolean;
    className?: string;
};

function buttonClasses({
    variant = 'primary',
    size = 'md',
    block,
    className,
}: StyleProps) {
    return cn(
        'press inline-flex items-center justify-center font-semibold',
        'disabled:pointer-events-none disabled:opacity-50',
        VARIANTS[variant],
        SIZES[size],
        block && 'w-full',
        className,
    );
}

type ButtonProps = StyleProps &
    Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> & {
        loading?: boolean;
    };

export function Button({
    variant,
    size,
    block,
    className,
    loading,
    disabled,
    children,
    ...rest
}: ButtonProps) {
    return (
        <button
            {...rest}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            className={buttonClasses({ variant, size, block, className })}
        >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {children}
        </button>
    );
}

type ButtonLinkProps = StyleProps & {
    href: string;
    children: React.ReactNode;
};

export function ButtonLink({
    href,
    variant,
    size,
    block,
    className,
    children,
}: ButtonLinkProps) {
    return (
        <Link
            href={href}
            className={buttonClasses({ variant, size, block, className })}
        >
            {children}
        </Link>
    );
}
