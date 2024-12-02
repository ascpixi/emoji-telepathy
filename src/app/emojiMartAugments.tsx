export interface EmEmojiProps {
    id?: string;
    shortcodes?: string;
    native?: string;
    size?: string;
    fallback?: string;
    set?: 'native' | 'apple' | 'facebook' | 'google' | 'twitter';
    skin?: '1' | '2' | '3' | '4' | '5' | '6';
}

declare global {
    // eslint-disable-next-line @typescript-eslint/no-namespace
    namespace JSX {
        interface IntrinsicElements {
            'em-emoji': EmEmojiProps;
        }
    }
}

// https://github.com/missive/emoji-mart/blob/main/packages/emoji-mart/src/utils.ts#L26
export interface EmojiData {
    id: string;
    name: string;
    native: string;
    unified: unknown; // we don't need this for now, feel free to change the type of these if we will ever need those
    keywords: unknown;
    shortcodes: unknown;
}
