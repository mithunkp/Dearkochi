'use client';

import { LocalEvent } from '@/app/local-events/page';
import { MapPin, Clock, Users, Lock, Zap } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface EventCardProps {
    event: LocalEvent;
    onClick: () => void;
}

export function EventCard({ event, onClick }: EventCardProps) {
    const isLive = event.event_type === 'live';
    const timeLeft = formatDistanceToNow(new Date(event.end_time), { addSuffix: true });

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-[26px] p-6 shadow-[0_14px_30px_rgba(88,63,160,0.06)] hover:shadow-[0_20px_40px_rgba(88,63,160,0.12)] transition-all cursor-pointer border border-transparent hover:border-purple-100 flex flex-col h-full"
        >
            <div className="flex justify-between items-start mb-4">
                <div className={`px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${isLive
                        ? 'bg-red-100 text-red-600'
                        : 'bg-purple-100 text-purple-600'
                    }`}>
                    {isLive ? <Zap size={12} /> : <Clock size={12} />}
                    {isLive ? 'LIVE' : 'Scheduled'}
                </div>
                {event.is_private && (
                    <div className="text-slate-400">
                        <Lock size={16} />
                    </div>
                )}
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-2">{event.title}</h3>

            <div className="space-y-2 mt-auto">
                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <MapPin size={16} className="text-slate-400" />
                    <span className="truncate">{event.location}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-slate-500">
                    <Clock size={16} className="text-slate-400" />
                    <span>Ends {timeLeft}</span>
                </div>

                {event.max_participants && (
                    <div className="flex items-center gap-2 text-sm text-slate-500">
                        <Users size={16} className="text-slate-400" />
                        <span>Limit: {event.max_participants} people</span>
                    </div>
                )}
            </div>

            {event.area && (
                <div className="mt-4 pt-4 border-t border-slate-50">
                    <span className="bg-slate-100 text-slate-600 text-xs px-2 py-1 rounded-md">
                        {event.area}
                    </span>
                </div>
            )}
        </div>
    );
}
