'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

// VAD Configuration
const VAD_SPEECH_START_THRESHOLD = 0.6;  // Probability threshold for speech start
const VAD_SPEECH_END_THRESHOLD = 0.5;    // Probability threshold for speech end
const VAD_MIN_SPEECH_DURATION = 300;     // Minimum speech duration in ms to trigger
const VAD_END_DELAY = 1500;              // Delay after speech ends before triggering callback

interface UseVADOptions {
    onSpeechStart?: () => void;
    onSpeechEnd?: () => void;
    onError?: (error: string) => void;
}

interface UseVADReturn {
    isVADActive: boolean;
    isSpeaking: boolean;
    startVAD: () => Promise<void>;
    stopVAD: () => void;
    isSupported: boolean;
}

export const useVAD = (options: UseVADOptions = {}): UseVADReturn => {
    const [isVADActive, setIsVADActive] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isSupported, setIsSupported] = useState(false);

    // Refs
    const vadInstanceRef = useRef<any>(null);
    const optionsRef = useRef(options);
    const speechStartTimeRef = useRef<number | null>(null);
    const speechEndTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Sync options ref
    useEffect(() => {
        optionsRef.current = options;
    }, [options]);

    // Check browser support
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const hasAudioContext = !!(window.AudioContext || (window as any).webkitAudioContext);
            const hasGetUserMedia = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
            setIsSupported(hasAudioContext && hasGetUserMedia);
        }
    }, []);

    // Start VAD
    const startVAD = useCallback(async () => {
        if (!isSupported) {
            console.error('[VAD] Not supported in this browser');
            optionsRef.current.onError?.('VAD not supported');
            return;
        }

        if (vadInstanceRef.current) {
            console.log('[VAD] Already active');
            return;
        }

        try {
            console.log('[VAD] Loading VAD module...');

            // Dynamically import to avoid SSR issues
            const { MicVAD } = await import('@ricky0123/vad-web');

            console.log('[VAD] Creating VAD instance...');

            const vad = await MicVAD.new({
                positiveSpeechThreshold: VAD_SPEECH_START_THRESHOLD,
                negativeSpeechThreshold: VAD_SPEECH_END_THRESHOLD,
                // Use local files from public folder to avoid version mismatch
                baseAssetPath: "/vad/",
                onnxWASMBasePath: "/onnx/",
                onSpeechStart: () => {
                    console.log('[VAD] Speech started detected');
                    speechStartTimeRef.current = Date.now();

                    // Clear any pending end timeout
                    if (speechEndTimeoutRef.current) {
                        clearTimeout(speechEndTimeoutRef.current);
                        speechEndTimeoutRef.current = null;
                    }

                    setIsSpeaking(true);
                    optionsRef.current.onSpeechStart?.();
                },
                onSpeechEnd: (audio: Float32Array) => {
                    console.log('[VAD] Speech ended detected, audio length:', audio.length);

                    // Check if speech was long enough
                    const speechDuration = speechStartTimeRef.current
                        ? Date.now() - speechStartTimeRef.current
                        : 0;

                    if (speechDuration < VAD_MIN_SPEECH_DURATION) {
                        console.log('[VAD] Speech too short, ignoring');
                        setIsSpeaking(false);
                        return;
                    }

                    // Delay before calling onSpeechEnd to allow user to continue
                    speechEndTimeoutRef.current = setTimeout(() => {
                        console.log('[VAD] Speech end confirmed after delay');
                        setIsSpeaking(false);
                        optionsRef.current.onSpeechEnd?.();
                        speechEndTimeoutRef.current = null;
                    }, VAD_END_DELAY);
                },
                onVADMisfire: () => {
                    console.log('[VAD] Misfire - false positive detected');
                    setIsSpeaking(false);
                },
            });

            vadInstanceRef.current = vad;
            vad.start();
            setIsVADActive(true);
            console.log('[VAD] Started successfully');

        } catch (error) {
            console.error('[VAD] Failed to start:', error);
            optionsRef.current.onError?.('Failed to start voice detection');
            setIsVADActive(false);
        }
    }, [isSupported]);

    // Stop VAD
    const stopVAD = useCallback(() => {
        console.log('[VAD] Stopping...');

        // Clear timeout
        if (speechEndTimeoutRef.current) {
            clearTimeout(speechEndTimeoutRef.current);
            speechEndTimeoutRef.current = null;
        }

        // Stop and destroy VAD instance
        if (vadInstanceRef.current) {
            try {
                vadInstanceRef.current.pause();
                vadInstanceRef.current.destroy();
            } catch (e) {
                console.warn('[VAD] Error stopping:', e);
            }
            vadInstanceRef.current = null;
        }

        setIsVADActive(false);
        setIsSpeaking(false);
        speechStartTimeRef.current = null;
        console.log('[VAD] Stopped');
    }, []);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            if (speechEndTimeoutRef.current) {
                clearTimeout(speechEndTimeoutRef.current);
            }
            if (vadInstanceRef.current) {
                try {
                    vadInstanceRef.current.pause();
                    vadInstanceRef.current.destroy();
                } catch (e) {
                    // Ignore cleanup errors
                }
                vadInstanceRef.current = null;
            }
        };
    }, []);

    return {
        isVADActive,
        isSpeaking,
        startVAD,
        stopVAD,
        isSupported,
    };
};
