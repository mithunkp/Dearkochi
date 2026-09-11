import { createElement } from 'react';
import type { LucideIcon } from 'lucide-react';

/**
 * Render a Lucide icon chosen at runtime.
 *
 * Assigning the looked-up component to a capitalised local
 * (`const Icon = getWeatherIcon(...)`) and rendering `<Icon />` trips the
 * react-hooks/static-components rule, which reads it as declaring a
 * component inside render. createElement builds an element instead, which
 * is what was always intended.
 */
export function DynamicIcon({
    icon,
    size,
    className,
    strokeWidth,
}: {
    icon: LucideIcon;
    size?: number;
    className?: string;
    strokeWidth?: number;
}) {
    return createElement(icon, { size, className, strokeWidth });
}
