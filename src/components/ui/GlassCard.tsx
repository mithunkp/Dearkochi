import React from 'react';

interface GlassCardProps {
    children: React.ReactNode;
    className?: string;
}

export function GlassCard({ children, className = '' }: GlassCardProps) {
    return (
        <div className={`bg-white/70 backdrop-blur-xl border border-white/40 rounded-[20px] p-5 shadow-[0_4px_24px_rgba(0,0,0,0.06)] ${className}`}>
            {children}
        </div>
    );
}
