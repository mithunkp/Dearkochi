'use client';

import { MapPin, Clock, Users, Lock, Zap, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import type { LocalEvent } from '@/app/types';

interface EventCardProps {
    event: LocalEvent;
    onClick: () => void;
    onDelete?: () => void;
    index?: number;
}

export function EventCard({ event, onClick, onDelete, index = 0 }: EventCardProps) {
    const isLive = event.event_type === 'live';
    const joined = event.participant_count ?? 0;
    const isFull = event.max_participants
        ? joined >= event.max_participants
        : false;
    const spotsLeft = event.max_participants
        ? event.max_participants - joined
        : null;
    const nearlyFull = spotsLeft !== null && spotsLeft <= 3 && spotsLeft > 0;

    const endsAt = new Date(event.end_time);
    const endsLabel = Number.isNaN(endsAt.getTime())
        ? null
        : formatDistanceToNow(endsAt, { addSuffix: true });

    return (
        <li
            style={{ '--dk-i': index } as React.CSSProperties}
            className="relative"
        >
            {/* A real button, so the card is reachable by keyboard. It was a
                bare <div onClick> before, which nothing but a mouse could
                activate. */}
            <button
                type="button"
                onClick={onClick}
                className={`press flex h-full w-full flex-col rounded-2xl border border-line bg-surface p-4 text-left shadow-e1 hover:border-line-strong hover:shadow-e2 ${isFull ? 'opacity-75' : ''
                    }`}
            >
                {/* Reserve room on the right when a delete control is
                    overlaid, so the Full badge never sits under it. */}
                <div
                    className={`flex items-center gap-2 ${onDelete ? 'pr-10' : ''}`}
                >
                    <span
                        className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide ${isLive
                                ? 'bg-cat-emergency-soft text-cat-emergency'
                                : 'bg-cat-social-soft text-cat-social'
                            }`}
                    >
                        {isLive ? <Zap size={11} /> : <Clock size={11} />}
                        {isLive ? 'Live' : 'Scheduled'}
                    </span>
                    {event.is_private && (
                        <span
                            className="text-faint"
                            title="Private event"
                            aria-label="Private event"
                        >
                            <Lock size={14} />
                        </span>
                    )}
                    {isFull && (
                        <span className="ml-auto rounded-full bg-cat-emergency-soft px-2 py-0.5 text-[11px] font-bold uppercase text-cat-emergency">
                            Full
                        </span>
                    )}
                </div>

                <h3 className="mt-2.5 line-clamp-2 text-[16px] font-bold leading-snug text-foreground">
                    {event.title}
                </h3>

                <div className="mt-3 space-y-1.5 text-[13px]">
                    <p className="flex items-center gap-2 text-muted">
                        <MapPin size={14} className="shrink-0 text-faint" />
                        <span className="truncate">{event.location}</span>
                    </p>
                    {endsLabel && (
                        <p className="flex items-center gap-2 text-muted">
                            <Clock size={14} className="shrink-0 text-faint" />
                            <span>Ends {endsLabel}</span>
                        </p>
                    )}
                    <p
                        className={`flex items-center gap-2 font-medium ${isFull
                                ? 'text-cat-emergency'
                                : nearlyFull
                                    ? 'text-cat-places'
                                    : 'text-muted'
                            }`}
                    >
                        <Users size={14} className="shrink-0" />
                        <span>
                            {joined}
                            {event.max_participants
                                ? ` / ${event.max_participants}`
                                : ''}{' '}
                            joined
                            {nearlyFull &&
                                ` · ${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`}
                        </span>
                    </p>
                </div>

                {event.area && (
                    <span className="mt-3 inline-flex w-fit rounded-md bg-surface-2 px-2 py-0.5 text-[11px] font-semibold text-muted">
                        {event.area}
                    </span>
                )}
            </button>

            {/* Sibling rather than nested, so it is not a button inside a
                button. */}
            {onDelete && (
                <button
                    type="button"
                    onClick={onDelete}
                    aria-label={`Delete ${event.title}`}
                    className="press absolute right-2.5 top-2.5 flex h-9 w-9 items-center justify-center rounded-full text-cat-emergency hover:bg-cat-emergency-soft"
                >
                    <Trash2 size={15} />
                </button>
            )}
        </li>
    );
}
