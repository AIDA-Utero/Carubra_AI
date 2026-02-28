'use client';

import React from 'react';
import { Message } from '@/types';
import FormattedMessage from './FormattedMessage';

interface ChatBubbleProps {
    messages: Message[];
    currentResponse?: string;
    className?: string; // Allow custom styling/dimensions
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ messages, currentResponse, className = '' }) => {
    const bottomRef = React.useRef<HTMLDivElement>(null);

    // Auto scroll to bottom when new messages arrive
    React.useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, currentResponse]);

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
                            <FormattedMessage content={message.content} />
                        ) : (
                            <p className="text-xs sm:text-sm leading-relaxed">{message.content}</p>
                        )}
                    </div>
                </div>
            ))}

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
