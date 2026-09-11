'use client';

import { MapPin, Users, Lock, Zap, Trash2, CalendarDays, Check } from 'lucide-react';
import type { LocalEvent } from '@/app/types';
import { getEventPhase, getTimingLabel, formatWhen } from '@/lib/event-time';

interface EventCardProps {
    event: LocalEvent;
    onClick: () => void;
    onDelete?: () => void;
    /** Marks events the signed-in person has already joined. */
    joined?: boolean;
    index?: number;
}

export function EventCard({
    event,
    onClick,
    onDelete,
    joined,
    index = 0,
}: EventCardProps) {
    const isLive = event.event_type === 'live';
    const phase = getEventPhase(event);
    const going = event.participant_count ?? 0;
    const isFull = event.max_participants
        ? going >= event.max_participants
        : false;
    const spotsLeft = event.max_participants
        ? event.max_participants - going
        : null;
    const nearlyFull = spotsLeft !== null && spotsLeft > 0 && spotsLeft <= 3;

    return (
        <li style={{ '--dk-i': index } as React.CSSProperties} className="relative">
            {/* A real button, so the card is reachable by keyboard. */}
            <button
                type="button"
                onClick={onClick}
                className={`press flex h-full w-full flex-col rounded-2xl border border-line bg-surface p-4 text-left shadow-e1 hover:border-line-strong hover:shadow-e2 ${
                    isFull && !joined ? 'opacity-75' : ''
                }`}
            >
                <div className={`flex items-center gap-2 ${onDelete ? 'pr-10' : ''}`}>
                    <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${
                            phase === 'happening'
                                ? 'bg-cat-emergency-soft text-cat-emergency'
                                : 'bg-cat-social-soft text-cat-social'
                        }`}
                    >
                        {phase === 'happening' ? (
                            <Zap size={11} />
                        ) : (
                            <CalendarDays size={11} />
                        )}
                        {phase === 'happening'
                            ? 'On now'
                            : isLive
                              ? 'Starting'
                              : 'Planned'}
                    </span>
                    {event.is_private && (
                        <span className="text-faint" aria-label="Private event">
                            <Lock size={14} />
                        </span>
                    )}
                    {joined && (
                        <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-bold text-success">
                            <Check size={11} />
                            Going
                        </span>
                    )}
                    {!joined && isFull && (
                        <span className="ml-auto rounded-full bg-surface-2 px-2 py-0.5 text-[11px] font-bold uppercase text-muted">
                            Full
                        </span>
                    )}
                </div>

                <h3 className="mt-2.5 line-clamp-2 text-[16px] font-bold leading-snug text-foreground">
                    {event.title}
                </h3>

                {/* When first: it is the thing people decide on. */}
                <p className="mt-2 text-[13px] font-semibold text-foreground">
                    {formatWhen(event.start_time)}
                </p>
                <p
                    className={`text-[12px] ${
                        phase === 'happening'
                            ? 'font-semibold text-cat-emergency'
                            : 'text-muted'
                    }`}
                >
                    {getTimingLabel(event)}
                </p>

                <div className="mt-2.5 flex flex-col gap-1.5 text-[13px]">
                    <p className="flex items-center gap-2 text-muted">
                        <MapPin size={14} className="shrink-0 text-faint" />
                        <span className="truncate">
                            {event.location}
                            {event.area ? ` · ${event.area}` : ''}
                        </span>
                    </p>
                    <p
                        className={`flex items-center gap-2 font-medium ${
                            nearlyFull ? 'text-accent' : 'text-muted'
                        }`}
                    >
                        <Users size={14} className="shrink-0" />
                        <span>
                            {going === 0
                                ? 'Be the first to join'
                                : `${going}${event.max_participants ? ` / ${event.max_participants}` : ''} going`}
                            {nearlyFull &&
                                ` · ${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`}
                        </span>
                    </p>
                </div>
            </button>

            {/* Sibling rather than nested, so it is not a button inside a
                button. */}
            {onDelete && (
                <button
                    type="button"
                    onClick={onDelete}
                    aria-label={`Delete ${event.title}`}
                    className="press absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full text-danger hover:bg-danger-soft"
                >
                    <Trash2 size={15} />
                </button>
            )}
        </li>
    );
}
