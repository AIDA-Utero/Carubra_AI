'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { VoiceControl, ChatBubble } from '@/components';
import { useVoiceAI } from '@/hooks/useVoiceAI';


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
    networkError,
    // VAD features
    isVADMode,
    isVADSupported,
    startVADMode,
    stopVADMode,
  } = useVoiceAI({
    onError: (error) => console.error('Voice AI Error:', error),
  });

  useEffect(() => {
    const timer = setTimeout(() => {
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
    } else if (state === 'standby' && isVADMode) {
      stopVADMode();
    }
  };

  const handleToggleVAD = async () => {
    if (isVADMode) {
      stopVADMode();
    } else {
      await startVADMode();
    }
  };



  return (
    <div className="fixed inset-0 h-[100dvh] w-full bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 overflow-hidden flex flex-col">

      {/* Background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none select-none">
        <div className="absolute top-1/4 -left-20 w-64 md:w-96 h-64 md:h-96 bg-red-600/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-20 w-64 md:w-96 h-64 md:h-96 bg-rose-600/20 rounded-full blur-3xl animate-pulse animation-delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 md:w-150 h-80 md:h-150 bg-red-700/10 rounded-full blur-3xl" />
      </div>

      <div
        className="fixed inset-0 opacity-5 pointer-events-none select-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Header */}
      <header className="relative z-50 flex items-center justify-between px-5 md:px-8 py-4 md:py-5 shrink-0">
        <div className="flex items-center gap-3 md:gap-5">
          {/* Mobile: small logo only */}
          <div className="flex sm:hidden items-center gap-3">
            <Image
              src="/carubra-agent.png"
              alt="CarubraAI"
              width={120}
              height={120}
              className="h-12 w-auto object-contain drop-shadow-[0_0_8px_rgba(255,255,255,0.15)]"
              priority
            />
            <div className="h-8 w-px bg-gradient-to-b from-transparent via-white/20 to-transparent" />
            <div className="flex flex-col">
              <p className="text-white/60 text-[10px] tracking-[0.15em] uppercase font-medium">
                Virtual Assistant
              </p>
            </div>
          </div>
          {/* Desktop: logo + divider + subtitle */}
          <div className="hidden sm:flex items-center gap-5">
            <Image
              src="/carubra-agent.png"
              alt="CarubraAI"
              width={180}
              height={50}
              className="h-12 md:h-14 w-auto object-contain"
              priority
            />
            <div className="self-stretch w-px bg-gradient-to-b from-transparent via-white/20 to-transparent my-2" />
            <div className="flex flex-col gap-1">
              <p className="text-white/70 text-sm md:text-base tracking-[0.2em] uppercase font-semibold">
                Virtual Assistant
              </p>
            </div>
          </div>
        </div>

        <div className="shrink-0 self-center">
          <div className="flex items-center gap-2 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-white/50 text-[10px] sm:text-xs font-medium tracking-wider uppercase">
              Powered by Carubra
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="relative z-10 flex-1 min-h-0 w-full flex flex-col items-center justify-center px-4 gap-4 md:gap-6 pb-2">

        {/* Avatar section */}
        <div className="relative shrink-0 flex items-center justify-center w-[150px] h-[150px] sm:w-[200px] sm:h-[200px] lg:w-[30vh] lg:h-[30vh]">
          <div className={`absolute inset-0 rounded-full blur-2xl transition-all duration-500 ${state === 'standby' ? 'bg-cyan-500/30' : ''} ${state === 'listening' ? 'bg-green-500/30' : ''} ${state === 'processing' ? 'bg-yellow-500/30' : ''} ${state === 'speaking' ? 'bg-rose-500/30' : ''} ${state === 'idle' ? 'bg-red-500/20' : ''}`} />

          <Image
            src={
              state === 'listening'
                ? "/Avatar-listening.png" // Gambar variasi kedua (mendengar)
                : state === 'processing'
                  ? "/Avatar-thinking.png"  // Gambar pose berpikir
                  : "/Avatar.png"           // Gambar default/idle
            }
            alt="Carubra AI Avatar"
            width={400}
            height={400}
            className="relative z-10 w-full h-full object-contain"
            priority
          />
        </div>

        {/* Response & Controls Wrapper */}
        <div className="w-full max-w-2xl flex flex-col items-center shrink min-h-0 gap-4 sm:gap-6 mt-2 sm:mt-4">

          {/* Chat Bubble Area */}
          <div className="w-full shrink min-h-0 overflow-y-auto px-2 custom-scrollbar flex flex-col items-center">
            {response && !messages.length ? (
              <div className="text-center">
                <p className="inline-block text-white/90 text-sm md:text-lg leading-relaxed bg-white/5 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/10 shadow-lg">
                  {response}
                </p>
              </div>
            ) : messages.length > 0 || state === 'processing' ? (
              <ChatBubble messages={messages} currentResponse={response} className="w-full" isProcessing={state === 'processing'} />
            ) : (
              <div className="text-center py-2">
                <p className="text-white/50 text-sm md:text-base leading-relaxed max-w-md mx-auto">
                  Tekan tombol mikrofon dan ajukan pertanyaan atau perintah apa pun kepada saya.
                </p>
              </div>
            )}
          </div>

          {/* Voice Controls */}
          <div className="shrink-0 flex flex-col items-center gap-3 w-full">
            <VoiceControl
              state={state}
              onStart={isVADMode ? undefined : startListening}
              onStop={handleStopInteraction}
              onStopSpeaking={stopSpeaking}
              isSupported={isSupported}
              transcript={transcript}
              networkError={networkError}
              isVADMode={isVADMode}
            />

            <div className="flex items-center gap-3">
              {/* VAD Toggle Button */}
              {isVADSupported && (
                <button
                  onClick={handleToggleVAD}
                  disabled={state === 'processing' || state === 'speaking'}
                  className={`px-4 py-2 rounded-full text-xs sm:text-sm transition-all duration-300 border backdrop-blur-sm flex items-center gap-2 ${isVADMode
                    ? 'bg-cyan-500/30 border-cyan-400/50 text-cyan-300 hover:bg-cyan-500/40'
                    : 'bg-white/10 border-white/20 text-white/80 hover:bg-white/20'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  title={isVADMode ? 'Matikan deteksi suara otomatis' : 'Aktifkan deteksi suara otomatis'}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    {isVADMode ? (
                      <>
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                        <circle cx="12" cy="12" r="10" strokeDasharray="3 3" className="animate-spin" style={{ animationDuration: '3s' }} />
                      </>
                    ) : (
                      <>
                        <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                        <line x1="12" y1="19" x2="12" y2="23" />
                        <line x1="8" y1="23" x2="16" y2="23" />
                      </>
                    )}
                  </svg>
                  {isVADMode ? 'Auto ON' : 'Auto'}
                </button>
              )}

              {state === 'idle' && !messages.length && !isVADMode && (
                <button
                  onClick={greet}
                  className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white/80 text-xs sm:text-sm transition-all duration-300 border border-white/20 backdrop-blur-sm"
                >
                  Sapa Saya
                </button>
              )}
            </div>

            {/* VAD Mode Status */}
            {isVADMode && state === 'standby' && (
              <p className="text-cyan-400/70 text-xs animate-pulse">
                Mendengarkan... Mulai berbicara kapan saja
              </p>
            )}
          </div>

        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-3 shrink-0 landscape:hidden md:landscape:block">
        <p className="text-white/30 text-[10px] sm:text-xs">
          © 2026 CarubraAI — PT Utero Kreatif Indonesia X DJJ DEV
        </p>
      </footer>
    </div>
  );
}
