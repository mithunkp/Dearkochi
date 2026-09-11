'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Copy, Download, Share2, Check, Link2 } from 'lucide-react';
import html2canvas from 'html2canvas';

import {
    ShareablePlaceCard,
    ShareableClassifiedCard,
    ShareableStoreCard,
    ShareableDatePlanCard,
} from './ShareableCards';
import { Sheet } from './Sheet';
import { Button } from './Button';
import { Notice } from './Notice';

type ShareType = 'place' | 'classified' | 'store' | 'date-plan';

/** Only the fields the shareable cards actually read. */
type ShareData = {
    image_url?: string | null;
    stickers?: { src: string;[key: string]: unknown }[];
    [key: string]: unknown;
};

interface ShareModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    url: string;
    type: ShareType;
    /* Accepts any record the shareable cards understand — callers pass
       domain interfaces (Attraction, Store, Ad) that have no index
       signature, so this is widened here and narrowed below. */
    data: object;
}

export function ShareModal({
    isOpen,
    onClose,
    title,
    url,
    type,
    data,
}: ShareModalProps) {
    const [tab, setTab] = useState<'link' | 'image'>('link');
    const [copied, setCopied] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [preview, setPreview] = useState<string | null>(null);
    const [proxied, setProxied] = useState<ShareData | null>(null);
    const [error, setError] = useState<string | null>(null);

    const captureRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;
        setTab('link');
        setCopied(false);
        setPreview(null);
        setGenerating(false);
        setProxied(null);
        setError(null);
    }, [isOpen]);

    /* html2canvas taints the canvas on cross-origin images, so every remote
       image is inlined as a data URL before capture. */
    const proxyImage = useCallback(async (src: string): Promise<string> => {
        try {
            if (!src) return '';
            if (src.startsWith('data:')) return src;

            const response = await fetch(src);
            const blob = await response.blob();
            return await new Promise((resolve, reject) => {
                const reader = new FileReader();
                reader.onloadend = () => resolve(reader.result as string);
                reader.onerror = reject;
                reader.readAsDataURL(blob);
            });
        } catch (err) {
            console.error('Error inlining image:', src, err);
            return src;
        }
    }, []);

    useEffect(() => {
        if (tab !== 'image' || proxied) return;

        let cancelled = false;
        (async () => {
            const next = JSON.parse(JSON.stringify(data)) as ShareData;

            if ((type === 'place' || type === 'classified') && next.image_url) {
                next.image_url = await proxyImage(next.image_url);
            } else if (type === 'date-plan' && Array.isArray(next.stickers)) {
                next.stickers = await Promise.all(
                    next.stickers.map(async (s) => ({
                        ...s,
                        src: await proxyImage(s.src),
                    })),
                );
            }

            if (!cancelled) setProxied(next);
        })();

        return () => {
            cancelled = true;
        };
    }, [tab, data, type, proxied, proxyImage]);

    const generateImage = useCallback(async () => {
        if (!captureRef.current) return;
        setGenerating(true);
        setError(null);
        try {
            // Let the freshly-injected data URLs paint before capturing.
            await new Promise((r) => setTimeout(r, 300));

            const canvas = await html2canvas(captureRef.current, {
                backgroundColor: '#ffffff',
                scale: 2,
                logging: false,
                useCORS: true,
                allowTaint: true,
            });
            setPreview(canvas.toDataURL('image/png'));
        } catch (err) {
            console.error('Error generating image:', err);
            setError('Could not build the image. Try the link instead.');
        } finally {
            setGenerating(false);
        }
    }, []);

    useEffect(() => {
        if (tab === 'image' && proxied && !preview && !generating) {
            generateImage();
        }
    }, [tab, proxied, preview, generating, generateImage]);

    const copyLink = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch {
            // Clipboard API needs a secure context and can be blocked.
            setError('Could not copy. Long-press the link to copy it manually.');
        }
    };

    /* Sharing a link through the OS sheet is the expected mobile action; the
       previous version only offered it for the generated image. */
    const canShareLink =
        typeof navigator !== 'undefined' && typeof navigator.share === 'function';

    const shareLink = async () => {
        try {
            await navigator.share({
                title,
                text: `${title} — on Dear Kochi`,
                url,
            });
        } catch (err) {
            // A user-cancelled share is not an error worth reporting.
            if ((err as Error)?.name !== 'AbortError') {
                console.error('Error sharing link:', err);
            }
        }
    };

    const downloadImage = () => {
        if (!preview) return;
        const link = document.createElement('a');
        link.href = preview;
        link.download = `dear-kochi-${type}-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const shareImage = async () => {
        if (!preview) return;
        try {
            const blob = await (await fetch(preview)).blob();
            const file = new File([blob], `dear-kochi-${type}.png`, {
                type: 'image/png',
            });

            if (navigator.canShare?.({ files: [file] })) {
                await navigator.share({
                    title,
                    text: `Check this out on Dear Kochi: ${title}`,
                    files: [file],
                });
            } else {
                downloadImage();
            }
        } catch (err) {
            if ((err as Error)?.name !== 'AbortError') {
                console.error('Error sharing image:', err);
            }
        }
    };

    return (
        <Sheet open={isOpen} onClose={onClose} title="Share">
            <div className="flex rounded-xl border border-line bg-surface-2 p-1">
                {(['link', 'image'] as const).map((id) => (
                    <button
                        key={id}
                        type="button"
                        onClick={() => setTab(id)}
                        aria-pressed={tab === id}
                        className={`press h-10 flex-1 rounded-lg text-sm font-semibold ${tab === id
                                ? 'bg-surface text-foreground shadow-e1'
                                : 'text-muted'
                            }`}
                    >
                        {id === 'link' ? 'Link' : 'Image'}
                    </button>
                ))}
            </div>

            {error && (
                <Notice tone="error" className="mt-3">
                    {error}
                </Notice>
            )}

            {tab === 'link' ? (
                <div className="mt-4 space-y-3">
                    <div className="rounded-xl border border-line bg-surface-2 p-4 text-center">
                        <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary-soft text-primary">
                            <Link2 size={26} />
                        </span>
                        <p className="font-bold text-foreground">{title}</p>
                        <p className="mt-1 truncate text-xs text-muted">{url}</p>
                    </div>

                    {canShareLink && (
                        <Button block size="lg" onClick={shareLink}>
                            <Share2 size={17} />
                            Share
                        </Button>
                    )}

                    <Button
                        block
                        size="lg"
                        variant={canShareLink ? 'secondary' : 'primary'}
                        onClick={copyLink}
                    >
                        {copied ? <Check size={17} /> : <Copy size={17} />}
                        {copied ? 'Copied' : 'Copy link'}
                    </Button>
                </div>
            ) : (
                <div className="mt-4 space-y-3">
                    <div className="flex min-h-[200px] items-center justify-center overflow-hidden rounded-xl border border-line bg-surface-2">
                        {generating || !proxied ? (
                            <div className="flex flex-col items-center gap-2 py-8">
                                <span
                                    aria-hidden
                                    className="h-8 w-8 animate-spin rounded-full border-4 border-line border-t-primary"
                                />
                                <p className="text-xs font-semibold text-muted">
                                    {proxied ? 'Building image…' : 'Preparing…'}
                                </p>
                            </div>
                        ) : preview ? (
                            // Generated in-browser as a data URL, so next/image
                            // cannot optimise it.
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                                src={preview}
                                alt={`Shareable card for ${title}`}
                                className="max-h-[380px] w-full object-contain"
                            />
                        ) : (
                            <p className="py-8 text-sm text-muted">
                                Preview unavailable
                            </p>
                        )}
                    </div>

                    <div className="flex gap-2">
                        {canShareLink && (
                            <Button
                                block
                                size="lg"
                                onClick={shareImage}
                                disabled={!preview}
                            >
                                <Share2 size={17} />
                                Share
                            </Button>
                        )}
                        <Button
                            block
                            size="lg"
                            variant={canShareLink ? 'secondary' : 'primary'}
                            onClick={downloadImage}
                            disabled={!preview}
                        >
                            <Download size={17} />
                            Download
                        </Button>
                    </div>
                </div>
            )}

            {/* Off-screen render target for html2canvas. */}
            <div
                aria-hidden
                style={{ position: 'absolute', top: -9999, left: -9999, zIndex: -10 }}
            >
                <div ref={captureRef}>
                    {proxied && <ShareableCardSwitch type={type} data={proxied} />}
                </div>
            </div>
        </Sheet>
    );
}

function ShareableCardSwitch({
    type,
    data,
}: {
    type: ShareType;
    data: ShareData;
}) {
    switch (type) {
        case 'place':
            return <ShareablePlaceCard place={data} />;
        case 'classified':
            return <ShareableClassifiedCard ad={data} />;
        case 'store':
            return <ShareableStoreCard store={data} />;
        case 'date-plan':
            return <ShareableDatePlanCard plan={data} />;
        default:
            return null;
    }
}
