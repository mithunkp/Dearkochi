'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Zap, CalendarDays, Lock, Globe, ShieldCheck, Users, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import { deriveArea } from '@/lib/event-time';
import { Notice } from '@/components/ui/Notice';
import { Button } from '@/components/ui/Button';
import { FullSheet } from '@/components/ui/FullSheet';
import { Field, TextInput, TextArea, Select } from '@/components/ui/Field';

const LocationPicker = dynamic(
    () => import('@/components/ui/LocationPicker').then((mod) => mod.default),
    {
        loading: () => (
            <div className="flex h-[260px] w-full animate-pulse items-center justify-center rounded-xl bg-surface-2 text-sm text-faint">
                Loading map…
            </div>
        ),
        ssr: false,
    },
);

interface CreateEventModalProps {
    isOpen: boolean;
    onClose: () => void;
    onCreated: () => void;
}

type EventType = 'live' | 'scheduled';

const EMPTY = {
    title: '',
    description: '',
    location: '',
    area: null as string | null,
    maxParticipants: '',
    isPrivate: false,
    requiresApproval: false,
    scheduledDate: '',
    scheduledTime: '',
    durationHours: '2',
    latitude: null as number | null,
    longitude: null as number | null,
};

/** Local YYYY-MM-DD, so the date input's min matches the user's own today. */
function todayLocal(): string {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export function CreateEventModal({ isOpen, onClose, onCreated }: CreateEventModalProps) {
    const { user } = useAuth();
    const [eventType, setEventType] = useState<EventType>('live');
    const [form, setForm] = useState(EMPTY);
    const [loading, setLoading] = useState(false);
    const [formError, setFormError] = useState<string | null>(null);
    const [nickname, setNickname] = useState<string | null>(null);
    const [nicknameDraft, setNicknameDraft] = useState('');
    const [showMap, setShowMap] = useState(false);

    /*
     * The real guard against duplicate events. `loading` alone was not enough:
     * setLoading(true) only ran after the profile lookup had awaited, so every
     * click before that resolved got its own insert. Five rows landed in 243ms
     * on 28 March from a single "Morning Run". A ref flips synchronously, so
     * the second click is rejected before it can await anything.
     */
    const submitting = useRef(false);

    const set = useCallback(
        <K extends keyof typeof EMPTY>(key: K, value: (typeof EMPTY)[K]) =>
            setForm((prev) => ({ ...prev, [key]: value })),
        [],
    );

    // Reset in an effect, not during render.
    useEffect(() => {
        if (isOpen) return;
        setForm(EMPTY);
        setEventType('live');
        setFormError(null);
        setNicknameDraft('');
        setShowMap(false);
        submitting.current = false;
    }, [isOpen]);

    /*
     * Ask for the nickname up front rather than after a failed submit. The old
     * form rejected the submission and revealed the field at the top of a long
     * scrolled page, where nobody saw it.
     */
    useEffect(() => {
        if (!isOpen || !user) return;
        let alive = true;
        supabase
            .from('profiles')
            .select('nickname')
            .eq('id', user.uid)
            .maybeSingle()
            .then(({ data }) => {
                if (alive) setNickname(data?.nickname ?? null);
            });
        return () => {
            alive = false;
        };
    }, [isOpen, user]);

    const needsNickname = nickname === null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (submitting.current) return;

        if (!user) {
            setFormError('Please sign in to create an event.');
            return;
        }

        const title = form.title.trim();
        if (!title) {
            setFormError('Give your event a name.');
            return;
        }
        if (!form.location.trim()) {
            setFormError('Add where people should meet.');
            return;
        }
        if (needsNickname && !nicknameDraft.trim()) {
            setFormError('Choose a nickname — it is what people will see.');
            return;
        }

        let startTime: Date;
        if (eventType === 'live') {
            startTime = new Date();
        } else {
            if (!form.scheduledDate || !form.scheduledTime) {
                setFormError('Pick the date and time it starts.');
                return;
            }
            startTime = new Date(`${form.scheduledDate}T${form.scheduledTime}`);
            if (Number.isNaN(startTime.getTime())) {
                setFormError('That date and time did not make sense.');
                return;
            }
            // Events in the past used to be accepted silently. Three of the
            // events already in the database start months before they were
            // created, so they never appeared in the list at all.
            if (startTime.getTime() <= Date.now()) {
                setFormError('That time has already passed. Pick a later one.');
                return;
            }
        }

        const hours = Number(form.durationHours) || 2;
        const endTime = new Date(startTime.getTime() + hours * 3600_000);

        const max = form.maxParticipants ? Number(form.maxParticipants) : null;
        if (max !== null && (!Number.isFinite(max) || max < 2)) {
            setFormError('A limit needs to be 2 or more.');
            return;
        }

        submitting.current = true;
        setLoading(true);
        setFormError(null);

        try {
            if (needsNickname) {
                const { error: profileError } = await supabase
                    .from('profiles')
                    .upsert({
                        id: user.uid,
                        email: user.email,
                        nickname: nicknameDraft.trim(),
                    });
                if (profileError) throw profileError;
                setNickname(nicknameDraft.trim());
            }

            const { data: newEvent, error } = await supabase
                .from('local_events')
                .insert({
                    creator_id: user.uid,
                    title,
                    description: form.description.trim() || null,
                    event_type: eventType,
                    location: form.location.trim(),
                    // Was hard-coded to null, which is why the area filter has
                    // never matched anything.
                    area: form.area,
                    start_time: startTime.toISOString(),
                    end_time: endTime.toISOString(),
                    max_participants: max,
                    is_private: form.isPrivate,
                    is_closed: false,
                    latitude: form.latitude,
                    longitude: form.longitude,
                    requires_approval: form.requiresApproval,
                })
                .select()
                .single();

            if (error) throw error;

            if (newEvent) {
                await supabase.from('event_participants').insert({
                    event_id: newEvent.id,
                    user_id: user.uid,
                    status: 'joined',
                });
            }

            onCreated();
        } catch (err) {
            console.error('Error creating event:', err);
            setFormError('Could not create this event. Please try again.');
            submitting.current = false;
        } finally {
            setLoading(false);
        }
    };

    const isLive = eventType === 'live';

    return (
        <FullSheet
            open={isOpen}
            onClose={onClose}
            title="Start something"
            subtitle="Other people in Kochi can join and come along"
            footer={
                <Button
                    type="submit"
                    form="create-event-form"
                    size="lg"
                    block
                    loading={loading}
                >
                    {isLive ? 'Post it now' : 'Put it on the calendar'}
                </Button>
            }
        >
            <form
                id="create-event-form"
                onSubmit={handleSubmit}
                className="mx-auto flex w-full max-w-lg flex-col gap-5"
            >
                {formError && <Notice tone="error">{formError}</Notice>}

                {/* Type picker. Naming the two kinds plainly is the fastest way
                    to explain what this section is for. */}
                <div className="grid grid-cols-2 gap-2">
                    <TypeCard
                        active={isLive}
                        onClick={() => setEventType('live')}
                        icon={<Zap size={18} />}
                        label="Happening now"
                        hint="Starts immediately"
                        tone="live"
                    />
                    <TypeCard
                        active={!isLive}
                        onClick={() => setEventType('scheduled')}
                        icon={<CalendarDays size={18} />}
                        label="Planned"
                        hint="Pick a date"
                        tone="planned"
                    />
                </div>

                {needsNickname && (
                    <Field
                        label="Your nickname"
                        hint="This is what everyone who joins will see. Your real name and email stay private."
                        required
                    >
                        {(id) => (
                            <TextInput
                                id={id}
                                value={nicknameDraft}
                                onChange={(e) => setNicknameDraft(e.target.value)}
                                maxLength={30}
                                placeholder="What should people call you?"
                                autoComplete="nickname"
                            />
                        )}
                    </Field>
                )}

                <Field label="What is it?" required>
                    {(id) => (
                        <TextInput
                            id={id}
                            value={form.title}
                            onChange={(e) => set('title', e.target.value)}
                            maxLength={80}
                            placeholder="Sunday morning run"
                        />
                    )}
                </Field>

                <Field
                    label="Any details?"
                    hint="Optional. Pace, what to bring, how to spot you."
                >
                    {(id) => (
                        <TextArea
                            id={id}
                            rows={3}
                            value={form.description}
                            onChange={(e) => set('description', e.target.value)}
                            maxLength={500}
                            placeholder="Easy 5k along Marine Drive, then coffee."
                        />
                    )}
                </Field>

                <Field
                    label="Where do you meet?"
                    required
                    hint={
                        isLive
                            ? 'Pick a public spot — a café, a park, a landmark.'
                            : undefined
                    }
                >
                    {(id) => (
                        <TextInput
                            id={id}
                            value={form.location}
                            onChange={(e) => set('location', e.target.value)}
                            maxLength={100}
                            placeholder="Marine Drive walkway"
                        />
                    )}
                </Field>

                {/* The map was 300px of always-on chrome in a form people
                    abandon. It is worth having, so it stays — behind a tap. */}
                <div>
                    <button
                        type="button"
                        onClick={() => setShowMap((v) => !v)}
                        aria-expanded={showMap}
                        className="press flex w-full items-center gap-2.5 rounded-xl border border-line bg-surface px-4 py-3 text-left"
                    >
                        <span className="flex-1 text-[14px] font-semibold text-foreground">
                            {form.latitude
                                ? 'Map pin added'
                                : 'Add a map pin (optional)'}
                        </span>
                        {form.latitude && (
                            <span className="text-[12px] font-medium text-success">
                                Set
                            </span>
                        )}
                        <ChevronDown
                            size={18}
                            className={`shrink-0 text-faint transition-transform ${showMap ? 'rotate-180' : ''}`}
                        />
                    </button>

                    {showMap && (
                        <div className="mt-2 overflow-hidden rounded-xl border border-line">
                            <div className="h-[260px] w-full bg-surface-2">
                                <LocationPicker
                                    restrictToCurrentLocation={isLive}
                                    onLocationSelect={(lat, lng, address) => {
                                        setForm((prev) => ({
                                            ...prev,
                                            latitude: lat,
                                            longitude: lng,
                                            area: deriveArea(address) ?? prev.area,
                                            location: address
                                                ? address.split(',')[0].trim()
                                                : prev.location,
                                        }));
                                    }}
                                />
                            </div>
                        </div>
                    )}
                </div>

                {isLive ? (
                    <Field
                        label="How long will you be there?"
                        hint="It disappears from the list when the time is up."
                    >
                        {(id) => (
                            <Select
                                id={id}
                                value={form.durationHours}
                                onChange={(e) => set('durationHours', e.target.value)}
                            >
                                <option value="1">1 hour</option>
                                <option value="2">2 hours</option>
                                <option value="3">3 hours</option>
                                <option value="4">4 hours</option>
                                <option value="6">6 hours</option>
                            </Select>
                        )}
                    </Field>
                ) : (
                    <>
                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Date" required>
                                {(id) => (
                                    <TextInput
                                        id={id}
                                        type="date"
                                        min={todayLocal()}
                                        value={form.scheduledDate}
                                        onChange={(e) =>
                                            set('scheduledDate', e.target.value)
                                        }
                                    />
                                )}
                            </Field>
                            <Field label="Start time" required>
                                {(id) => (
                                    <TextInput
                                        id={id}
                                        type="time"
                                        value={form.scheduledTime}
                                        onChange={(e) =>
                                            set('scheduledTime', e.target.value)
                                        }
                                    />
                                )}
                            </Field>
                        </div>
                        {/* Scheduled events used to get a hard-coded 3-hour
                            end time, so they vanished from the list three
                            hours after starting no matter how long they ran. */}
                        <Field label="How long will it run?">
                            {(id) => (
                                <Select
                                    id={id}
                                    value={form.durationHours}
                                    onChange={(e) =>
                                        set('durationHours', e.target.value)
                                    }
                                >
                                    <option value="1">1 hour</option>
                                    <option value="2">2 hours</option>
                                    <option value="3">3 hours</option>
                                    <option value="4">4 hours</option>
                                    <option value="6">6 hours</option>
                                    <option value="8">All day</option>
                                </Select>
                            )}
                        </Field>
                    </>
                )}

                <div className="flex flex-col gap-2 border-t border-line pt-5">
                    <Toggle
                        checked={form.isPrivate}
                        onChange={(v) => set('isPrivate', v)}
                        icon={form.isPrivate ? <Lock size={18} /> : <Globe size={18} />}
                        label="Private"
                        hint={
                            form.isPrivate
                                ? 'Only people who joined can read the chat'
                                : 'Anyone can read the chat'
                        }
                    />
                    <Toggle
                        checked={form.requiresApproval}
                        onChange={(v) => set('requiresApproval', v)}
                        icon={
                            form.requiresApproval ? (
                                <ShieldCheck size={18} />
                            ) : (
                                <Users size={18} />
                            )
                        }
                        label="Approve each person"
                        hint={
                            form.requiresApproval
                                ? 'You accept or decline every request'
                                : 'Anyone can join straight away'
                        }
                    />
                </div>

                <Field
                    label="Limit how many can join"
                    hint="Leave empty for no limit."
                >
                    {(id) => (
                        <TextInput
                            id={id}
                            type="number"
                            inputMode="numeric"
                            min={2}
                            max={500}
                            value={form.maxParticipants}
                            onChange={(e) => set('maxParticipants', e.target.value)}
                            placeholder="No limit"
                        />
                    )}
                </Field>
            </form>
        </FullSheet>
    );
}

function TypeCard({
    active,
    onClick,
    icon,
    label,
    hint,
    tone,
}: {
    active: boolean;
    onClick: () => void;
    icon: React.ReactNode;
    label: string;
    hint: string;
    tone: 'live' | 'planned';
}) {
    const accent =
        tone === 'live'
            ? 'text-cat-emergency bg-cat-emergency-soft'
            : 'text-cat-social bg-cat-social-soft';
    return (
        <button
            type="button"
            onClick={onClick}
            aria-pressed={active}
            className={`press flex flex-col items-start gap-1.5 rounded-2xl border-2 p-3.5 text-left ${
                active
                    ? 'border-primary bg-primary-soft/40'
                    : 'border-line bg-surface'
            }`}
        >
            <span
                className={`flex h-9 w-9 items-center justify-center rounded-xl ${accent}`}
            >
                {icon}
            </span>
            <span className="text-[14px] font-bold leading-tight text-foreground">
                {label}
            </span>
            <span className="text-[12px] leading-tight text-muted">{hint}</span>
        </button>
    );
}

function Toggle({
    checked,
    onChange,
    icon,
    label,
    hint,
}: {
    checked: boolean;
    onChange: (v: boolean) => void;
    icon: React.ReactNode;
    label: string;
    hint: string;
}) {
    return (
        <label className="flex cursor-pointer items-center gap-3 rounded-xl px-1 py-2">
            <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                    checked
                        ? 'bg-primary-soft text-primary'
                        : 'bg-surface-2 text-faint'
                }`}
            >
                {icon}
            </span>
            <span className="min-w-0 flex-1">
                <span className="block text-[14px] font-semibold text-foreground">
                    {label}
                </span>
                <span className="block text-[12px] leading-snug text-muted">
                    {hint}
                </span>
            </span>
            <input
                type="checkbox"
                className="peer sr-only"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
            {/* The knob is an ::after on the track rather than a nested span:
                `peer-checked:` compiles to a sibling selector, so it cannot
                reach an element nested inside the track. */}
            <span className="relative h-7 w-12 shrink-0 rounded-full bg-surface-3 transition-colors after:absolute after:left-1 after:top-1 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform after:content-[''] peer-checked:bg-primary peer-checked:after:translate-x-5 peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2" />
        </label>
    );
}
