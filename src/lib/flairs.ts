export const PUBLIC_FLAIRS = [
    '⭐', '🌟', '✨', '💫', '🔥', '❤️', '💙', '💚', '💜', '🧡',
    '🎨', '🎭', '🎪', '🎬', '🎮', '🎯', '🎲', '🎵', '🎸', '🎹',
    '☕', '🍕', '🍔', '🍰', '🍦', '🍺', '🍷', '🥂', '🍾', '🎂',
    '🚀', '✈️', '🚗', '🏍️', '🚲', '⛵', '🏄', '🏊', '⚽', '🏀',
    '📚', '📖', '✍️', '💼', '💻', '📱', '🎓', '🏆', '👑', '💎'
];

export const SPECIAL_FLAIRS = [
    '💠', // Diamond with dot
    '⚕️', // Medical symbol
    '🔱', // Trident
    '⚜️', // Fleur-de-lis
    '🌀', // Cyclone
    '🧿', // Nazar amulet
    '🔮', // Crystal ball
    '🛡️', // Shield
    '⚛️', // Atom symbol
    '☢️', // Radioactive
    '☣️', // Biohazard
    '㊗️', // Congratulation
    '㊙️', // Secret
    '🦄', // Unicorn (Rare)
    '🐲', // Dragon face
    '🦅', // Eagle
    '🦁', // Lion
    '🐯', // Tiger face
    '🆗', // OK button
    '🆒', // COOL button
    '🆕', // NEW button
    '🆙', // UP button
    '🆔', // ID button
    '🆚', // VS button
    '🥇', // 1st place
    '🥈', // 2nd place
    '🥉', // 3rd place
    '🏅', // Sports medal
    '🎖️', // Military medal
    '👮', // Police
    '🕵️', // Detective
    '💂', // Guard
    '🧙', // Mage
    '🧚', // Fairy
    '🧛', // Vampire
    '🧜', // Merperson
    '🧝', // Elf
    '🧞', // Genie
    '🧟', // Zombie
];

export const ALL_FLAIRS = [...PUBLIC_FLAIRS, ...SPECIAL_FLAIRS];

export const isSpecialFlair = (flair: string | null) => {
    if (!flair) return false;
    return SPECIAL_FLAIRS.includes(flair);
};
