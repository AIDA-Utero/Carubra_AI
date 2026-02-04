// Voice AI State Types
export type VoiceState = 'idle' | 'standby' | 'listening' | 'processing' | 'speaking';

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface ChatResponse {
    id: string;
    choices: {
        message: {
            role: string;
            content: string;
        };
        finish_reason: string;
    }[];
    model: string;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

export interface APIError {
    error: string;
    message?: string;
}

// Avatar animation states
export type AvatarMood = 'neutral' | 'happy' | 'thinking' | 'speaking';

export interface AvatarState {
    mood: AvatarMood;
    isSpeaking: boolean;
    mouthOpen: number; // 0-1 for lip sync
}

// Speech Recognition types (extending Web Speech API)
export interface SpeechRecognitionEvent extends Event {
    results: SpeechRecognitionResultList;
    resultIndex: number;
}

export interface SpeechRecognitionResultList {
    length: number;
    item(index: number): SpeechRecognitionResult;
    [index: number]: SpeechRecognitionResult;
}

export interface SpeechRecognitionResult {
    isFinal: boolean;
    length: number;
    item(index: number): SpeechRecognitionAlternative;
    [index: number]: SpeechRecognitionAlternative;
}

export interface SpeechRecognitionAlternative {
    transcript: string;
    confidence: number;
}
