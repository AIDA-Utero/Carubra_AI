'use client';

import React from 'react';
import { VoiceState } from '@/types';

interface VoiceControlProps {
    state: VoiceState;
    onStart?: () => void;
    onStop: () => void;
    onStopSpeaking?: () => void;
    isSupported: boolean;
    transcript?: string;
    networkError?: boolean;
    isVADMode?: boolean;
}

const VoiceControl: React.FC<VoiceControlProps> = ({
    state,
    onStart,
    onStop,
    onStopSpeaking,
    isSupported,
    transcript,
    networkError = false,
    isVADMode = false,
}) => {
    // Single unified button handler
    const handleClick = () => {
        switch (state) {
            case 'idle':
                if (onStart) onStart();
                break;
            case 'standby':
                onStop(); // Stop VAD mode
                break;
            case 'listening':
                onStop();
                break;
            case 'processing':
            case 'speaking':
                if (onStopSpeaking) {
                    onStopSpeaking();
                }
                break;
        }
    };

    const getButtonColor = () => {
        switch (state) {
            case 'standby':
                return 'from-cyan-500 to-cyan-700';
            case 'listening':
                return networkError
                    ? 'from-orange-500 to-red-600' // Orange/Red for network error retrying
                    : 'from-green-500 to-emerald-600';
            case 'processing':
                return 'from-yellow-500 to-amber-600';
            case 'speaking':
                return 'from-rose-500 to-red-600';
            default:
                return 'from-red-500 to-red-700';
        }
    };

    const getStatusText = () => {
        switch (state) {
            case 'standby':
                return 'Siap mendengarkan';
            case 'listening':
                return networkError ? 'Mencoba menghubungkan...' : 'Mendengarkan...';
            case 'processing':
                return 'Memproses...';
            case 'speaking':
                return 'Berbicara...';
            default:
                return isVADMode ? 'Mode Auto Aktif' : 'Tekan untuk berbicara';
        }
    };

    const getHintText = () => {
        switch (state) {
            case 'standby':
                return 'Tekan untuk mematikan mode auto';
            case 'listening':
                return 'Tekan untuk berhenti';
            case 'processing':
            case 'speaking':
                return 'Tekan untuk bertanya ulang';
            default:
                return null;
        }
    };

    const getIcon = () => {
        // Show Stop icon when processing or speaking
        if (state === 'processing' || state === 'speaking') {
            return (
                <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="6" width="12" height="12" rx="2" />
                </svg>
            );
        }

        // Show standby icon for VAD mode
        if (state === 'standby') {
            return (
                <svg
                    className="w-10 h-10"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                    <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 2" className="animate-spin" style={{ animationDuration: '4s' }} />
                </svg>
            );
        }

        // Show Microphone icon for idle and listening
        if (state === 'listening') {
            return (
                <svg
                    className="w-10 h-10 animate-pulse"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
                    <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
                </svg>
            );
        }

        // Default microphone icon
        return (
            <svg className="w-10 h-10" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3zm-1-9c0-.55.45-1 1-1s1 .45 1 1v6c0 .55-.45 1-1 1s-1-.45-1-1V5z" />
                <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z" />
            </svg>
        );
    };

    if (!isSupported) {
        return (
            <div className="text-center p-4 bg-red-500/20 rounded-2xl border border-red-500/30">
                <p className="text-red-400 font-medium">
                    Browser Anda tidak mendukung Web Speech API
                </p>
                <p className="text-red-400/70 text-sm mt-1">
                    Silakan gunakan Google Chrome atau Microsoft Edge
                </p>
            </div>
        );
    }

    return (
        <div className="flex flex-col items-center gap-4">
            {/* Single unified control button */}
            <button
                onClick={handleClick}
                disabled={state === 'idle' && isVADMode && !onStart}
                className={`
                    relative w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-full
                    bg-gradient-to-br ${getButtonColor()}
                    text-white shadow-lg
                    transform transition-all duration-300
                    hover:scale-110 hover:shadow-2xl
                    active:scale-95
                    focus:outline-none focus:ring-4 focus:ring-white/30
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                `}
                title={state === 'idle' ? 'Mulai berbicara' : state === 'standby' ? 'Matikan mode auto' : state === 'listening' ? 'Berhenti mendengarkan' : 'Hentikan dan tanya ulang'}
            >
                {/* Pulse animation ring for standby (VAD waiting) */}
                {state === 'standby' && (
                    <>
                        <span className="absolute inset-0 rounded-full bg-cyan-400 animate-ping opacity-20" style={{ animationDuration: '2s' }} />
                        <span className="absolute inset-0 rounded-full bg-cyan-400 animate-pulse opacity-20" />
                    </>
                )}

                {/* Pulse animation ring for listening */}
                {state === 'listening' && (
                    <>
                        <span className="absolute inset-0 rounded-full bg-green-400 animate-ping opacity-40" />
                        <span className="absolute inset-0 rounded-full bg-green-400 animate-pulse opacity-30" />
                    </>
                )}

                {/* Pulse animation for processing */}
                {state === 'processing' && (
                    <span className="absolute inset-0 rounded-full bg-yellow-400 animate-pulse opacity-30" />
                )}

                {/* Pulse animation for speaking */}
                {state === 'speaking' && (
                    <span className="absolute inset-0 rounded-full bg-rose-400 animate-pulse opacity-30" />
                )}

                {/* Icon */}
                <span className="relative z-10 flex items-center justify-center [&>svg]:w-6 [&>svg]:h-6 [&>svg]:sm:w-7 [&>svg]:sm:h-7 [&>svg]:md:w-8 [&>svg]:md:h-8 [&>svg]:lg:w-10 [&>svg]:lg:h-10">
                    {getIcon()}
                </span>
            </button>

            {/* Status text */}
            <div className="text-center">
                <p className="text-white/90 font-medium text-sm sm:text-base md:text-lg">{getStatusText()}</p>

                {/* Hint text */}
                {getHintText() && (
                    <p className="text-white/50 text-[10px] sm:text-xs md:text-sm mt-0.5 sm:mt-1">
                        {getHintText()}
                    </p>
                )}

                {/* Transcript preview */}
                {transcript && state === 'listening' && (
                    <p className="text-white/60 text-[10px] sm:text-xs md:text-sm mt-1 sm:mt-2 max-w-[200px] sm:max-w-xs truncate">
                        &quot;{transcript}&quot;
                    </p>
                )}

                {/* Network Error Message */}
                {networkError && (
                    <p className="text-orange-300 text-[10px] sm:text-xs font-medium mt-2 animate-pulse">
                        Koneksi tidak stabil, mencoba ulang...
                    </p>
                )}
            </div>

            {/* Audio wave animation for listening state */}
            {state === 'listening' && (
                <div className="flex items-center gap-0.5 sm:gap-1 h-5 sm:h-6 md:h-8">
                    {[...Array(5)].map((_, i) => (
                        <div
                            key={i}
                            className="w-0.5 sm:w-1 bg-green-400 rounded-full animate-pulse"
                            style={{
                                height: `${8 + Math.random() * 16}px`,
                                animationDelay: `${i * 0.1}s`,
                                animationDuration: '0.5s',
                            }}
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default VoiceControl;
