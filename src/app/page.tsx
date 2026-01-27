'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { AvatarCanvas, VoiceControl, ChatBubble } from '@/components';
import { useVoiceAI } from '@/hooks/useVoiceAI';
import Logo from './logo.png';

export default function Home() {
  const {
    state,
    transcript,
    response,
    isSupported,
    startListening,
    stopListening,
    messages,
    greet,
    stopSpeaking,
  } = useVoiceAI({
    onError: (error) => console.error('Voice AI Error:', error),
  });

  // Greet on first load
  useEffect(() => {
    // Small delay to ensure voices are loaded
    const timer = setTimeout(() => {
      // Load voices first
      if ('speechSynthesis' in window) {
        window.speechSynthesis.getVoices();
      }
    }, 500);

    return () => clearTimeout(timer);
  }, []);

  const handleStopInteraction = () => {
    if (state === 'listening') {
      stopListening();
    } else if (state === 'speaking') {
      stopSpeaking();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 overflow-hidden relative">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-red-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-rose-600/20 rounded-full blur-3xl animate-pulse animation-delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-150 h-150 bg-red-700/10 rounded-full blur-3xl" />
      </div>

      {/* Grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-5 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Header */}
      <header className="relative z-10 flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-3">
          <div className="w-20 h-20 relative">
            <Image
              src={Logo}
              alt="Utero Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div>
            <h1 className="text-white font-bold text-lg tracking-tight">
              Utero AI
            </h1>
            <p className="text-white/50 text-xs">Virtual Assistant</p>
          </div>
        </div>

      </header>

      {/* Main content */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-[calc(100vh-180px)] px-4">
        {/* Avatar section */}
        <div className="relative mb-8">
          {/* Glow effect behind avatar */}
          <div
            className={`
              absolute inset-0 rounded-full blur-3xl transition-all duration-500
              ${state === 'listening' ? 'bg-green-500/30' : ''}
              ${state === 'processing' ? 'bg-yellow-500/30' : ''}
              ${state === 'speaking' ? 'bg-rose-500/30' : ''}
              ${state === 'idle' ? 'bg-red-500/20' : ''}
            `}
          />

          <AvatarCanvas state={state} className="relative z-10" />
        </div>

        {/* Response/Chat bubble */}
        <div className="w-full max-w-2xl mb-8 min-h-25">
          {response && !messages.length ? (
            <div className="text-center">
              <p className="text-white/90 text-lg leading-relaxed bg-white/5 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/10">
                {response}
              </p>
            </div>
          ) : messages.length > 0 ? (
            <ChatBubble messages={messages} currentResponse={response} />
          ) : (
            <div className="text-center">
              <p className="text-white/50 text-base">
                Tekan tombol mikrofon dan ajukan pertanyaan seputar PT Utero Kreatif Indonesia
              </p>
            </div>
          )}
        </div>

        {/* Voice control */}
        <VoiceControl
          state={state}
          onStart={startListening}
          onStop={handleStopInteraction}
          isSupported={isSupported}
          transcript={transcript}
        />

        {/* Greet button */}
        {state === 'idle' && !messages.length && (
          <button
            onClick={greet}
            className="mt-6 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white/80 text-sm transition-all duration-300 border border-white/20"
          >
            Sapa Saya
          </button>
        )}
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-4">
        <p className="text-white/30 text-sm">
          PT Utero Kreatif Indonesia X POLINEMA DEV © 2026
        </p>
      </footer>
    </div>
  );
}
