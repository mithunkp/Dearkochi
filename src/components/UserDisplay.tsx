import React from 'react';

interface UserDisplayProps {
    nickname?: string | null;
    flair?: string | null;
    email?: string | null;
    full_name?: string | null;
    className?: string;
    showFlair?: boolean;
    fallback?: string;
    hideName?: boolean;
}

/**
 * Component to display user information with their nickname and optional flair.
 * Priority: nickname > full_name > email (first part) > fallback
 */
export function UserDisplay({
    nickname,
    flair,
    email,
    full_name,
    className = '',
    showFlair = true,
    fallback = 'Anonymous',
    hideName = false
}: UserDisplayProps) {
    // Strictly prefer nickname. If not available, use fallback.
    // Ensure we do NOT show full_name or email parts for public visibility as per requirement.
    const displayName = nickname || fallback;

    return (
        <div className={`flex flex-col items-start ${className}`}>
            {!hideName && (
                <span className="font-medium leading-none">
                    {displayName}
                </span>
            )}
            {showFlair && flair && (
                <span className="text-[10px] text-gray-500 font-medium mt-0.5 px-1 bg-gray-100 rounded-md border border-gray-200">
                    {flair}
                </span>
            )}
        </div>
    );
}
