'use client';

import React from 'react';
import { Message } from '@/types';
import FormattedMessage from './FormattedMessage';

interface ChatBubbleProps {
    messages: Message[];
    currentResponse?: string;
    className?: string;
    isProcessing?: boolean;
}

// Typing indicator component with bouncing dots
const TypingIndicator: React.FC = () => (
    <div className="flex justify-start animate-fadeIn">
        <div className="max-w-[90%] sm:max-w-[85%] px-4 sm:px-5 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-bl-none">
            <div className="flex items-center gap-1.5">
                <div className="typing-dot w-2 h-2 rounded-full bg-white/80" />
                <div className="typing-dot w-2 h-2 rounded-full bg-white/80" />
                <div className="typing-dot w-2 h-2 rounded-full bg-white/80" />
            </div>
        </div>
    </div>
);

// Typing effect component - reveals text word-by-word then shows FormattedMessage
interface TypingMessageProps {
    content: string;         // Clean text (for typing display)
    displayContent: string;  // Original formatted text (for FormattedMessage after typing)
    onComplete: () => void;
}

const TypingMessage: React.FC<TypingMessageProps> = ({ content, displayContent, onComplete }) => {
    const words = React.useMemo(() => content.split(/\s+/).filter(Boolean), [content]);
    const [wordIndex, setWordIndex] = React.useState(0);
    const isComplete = wordIndex >= words.length;
    const onCompleteRef = React.useRef(onComplete);
    onCompleteRef.current = onComplete;

    // Adaptive speed: shorter text = slower (more readable), longer text = faster
    const speed = React.useMemo(() => {
        if (words.length <= 15) return 50;  // Short: 50ms/word
        if (words.length <= 40) return 35;  // Medium: 35ms/word
        return 25;                           // Long: 25ms/word
    }, [words.length]);

    React.useEffect(() => {
        if (isComplete) {
            onCompleteRef.current();
            return;
        }

        const timer = setTimeout(() => {
            setWordIndex(prev => prev + 1);
        }, speed);

        return () => clearTimeout(timer);
    }, [wordIndex, isComplete, speed]);

    if (isComplete) {
        return <FormattedMessage content={displayContent} />;
    }

    return (
        <p className="text-xs sm:text-sm leading-relaxed">
            {words.slice(0, wordIndex).join(' ')}
            <span className="typing-cursor" />
        </p>
    );
};

const ChatBubble: React.FC<ChatBubbleProps> = ({ messages, currentResponse, className = '', isProcessing = false }) => {
    const bottomRef = React.useRef<HTMLDivElement>(null);
    const prevMessageCountRef = React.useRef(messages.length);
    const [typingIndex, setTypingIndex] = React.useState<number | null>(null);

    // Detect when a new assistant message is added → trigger typing effect
    React.useEffect(() => {
        if (messages.length > prevMessageCountRef.current) {
            const lastMsg = messages[messages.length - 1];
            if (lastMsg?.role === 'assistant') {
                setTypingIndex(messages.length - 1);
            }
        }
        prevMessageCountRef.current = messages.length;
    }, [messages]);

    const handleTypingComplete = React.useCallback(() => {
        setTypingIndex(null);
    }, []);

    // Auto scroll to bottom
    React.useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, currentResponse, isProcessing, typingIndex]);

    return (
        <div className={`w-full max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg mx-auto overflow-y-auto px-1 sm:px-2 space-y-2 sm:space-y-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent ${className}`}>
            {messages.map((message, index) => (
                <div
                    key={index}
                    className={`
            flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}
            animate-fadeIn
          `}
                >
                    <div
                        className={`
              max-w-[90%] sm:max-w-[85%] px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl
              ${message.role === 'user'
                                ? 'bg-red-600 text-white rounded-br-none'
                                : 'bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-bl-none'
                            }
            `}
                    >
                        {message.role === 'assistant' ? (
                            index === typingIndex ? (
                                <TypingMessage
                                    content={message.content}
                                    displayContent={message.displayContent || message.content}
                                    onComplete={handleTypingComplete}
                                />
                            ) : (
                                <FormattedMessage content={message.displayContent || message.content} />
                            )
                        ) : (
                            <p className="text-xs sm:text-sm leading-relaxed">{message.content}</p>
                        )}
                    </div>
                </div>
            ))}

            {/* Typing indicator when processing */}
            {isProcessing && <TypingIndicator />}

            {/* Current response being spoken */}
            {currentResponse && messages[messages.length - 1]?.content !== currentResponse && (
                <div className="flex justify-start animate-fadeIn">
                    <div className="max-w-[90%] sm:max-w-[85%] px-3 sm:px-4 py-2 sm:py-3 rounded-xl sm:rounded-2xl bg-white/10 backdrop-blur-md text-white border border-white/20 rounded-bl-none">
                        <p className="text-xs sm:text-sm leading-relaxed">{currentResponse}</p>
                    </div>
                </div>
            )}

            <div ref={bottomRef} />
        </div>
    );
};

export default ChatBubble;

