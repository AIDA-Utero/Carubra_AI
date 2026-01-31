'use client';

import { useEffect } from 'react';
import Image from 'next/image';
import { AvatarCanvas, VoiceControl, ChatBubble, ModelSelector } from '@/components';
import { useVoiceAI } from '@/hooks/useVoiceAI';
import { AIModel } from '@/constants/ai';
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
    currentModel,
    setCurrentModel,
    networkError,
  } = useVoiceAI({
    onError: (error) => console.error('Voice AI Error:', error),
  });

  // Greet on first load
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
    }
  };

  const handleModelChange = (model: AIModel) => {
    setCurrentModel(model.id);
    console.log('[Model] Changed to:', model.name, '(', model.provider, ')');
  };

  return (
    <div className="h-[100dvh] w-full bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 overflow-hidden relative flex flex-col">
      
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
      <header className="relative z-50 flex items-center justify-between px-4 py-3 md:py-4 shrink-0 h-16 md:h-20">
        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 md:w-14 md:h-14 relative shrink-0">
            <Image
              src={Logo}
              alt="Utero Logo"
              fill
              className="object-contain"
              priority
              sizes="56px"
            />
          </div>
          <div className="hidden xs:block">
            <h1 className="text-white font-bold text-sm md:text-lg tracking-tight whitespace-nowrap">
              Utero AI
            </h1>
            <p className="text-white/50 text-[10px] sm:text-xs">Virtual Assistant</p>
          </div>
        </div>

        <div className="shrink-0 w-32 sm:w-auto">
          <ModelSelector
            selectedModel={currentModel}
            onModelChange={handleModelChange}
            disabled={state !== 'idle'}
          />
        </div>
      </header>

      {/* Main content - Flex Col & Center untuk semua ukuran layar */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center min-h-0 px-4 gap-4 md:gap-6 pb-2">
        
        {/* Avatar section */}
        <div className="relative shrink-0 flex items-center justify-center w-[150px] h-[150px] sm:w-[200px] sm:h-[200px] lg:w-[30vh] lg:h-[30vh]">
          {/* Glow effect - Penulisan className satu baris (Anti Hydration Error) */}
          <div className={`absolute inset-0 rounded-full blur-2xl transition-all duration-500 ${state === 'listening' ? 'bg-green-500/30' : ''} ${state === 'processing' ? 'bg-yellow-500/30' : ''} ${state === 'speaking' ? 'bg-rose-500/30' : ''} ${state === 'idle' ? 'bg-red-500/20' : ''}`} />
          
          <AvatarCanvas state={state} className="relative z-10 w-full h-full" />
        </div>

        {/* Response & Controls Wrapper */}
        {/* Tidak pakai flex-1 agar tidak melar (fixing jarak terlalu jauh) */}
        <div className="w-full max-w-2xl flex flex-col items-center gap-6 mt-4">
          
          {/* Chat Bubble Area - Max Height agar bisa discroll tapi tidak menutupi avatar */}
          <div className="w-full max-h-[50vh] overflow-y-auto px-2 custom-scrollbar flex flex-col items-center">
            {response && !messages.length ? (
              <div className="text-center">
                <p className="inline-block text-white/90 text-sm md:text-lg leading-relaxed bg-white/5 backdrop-blur-md rounded-2xl px-6 py-4 border border-white/10 shadow-lg">
                  {response}
                </p>
              </div>
            ) : messages.length > 0 ? (
              <ChatBubble messages={messages} currentResponse={response} className="w-full" />
            ) : (
              <div className="text-center py-2">
                <p className="text-white/50 text-sm md:text-base leading-relaxed max-w-md mx-auto">
                  Tekan tombol mikrofon dan ajukan pertanyaan seputar PT Utero Kreatif Indonesia
                </p>
              </div>
            )}
          </div>

          {/* Voice Controls */}
          <div className="shrink-0 flex flex-col items-center gap-3 w-full">
            <VoiceControl
              state={state}
              onStart={startListening}
              onStop={handleStopInteraction}
              onStopSpeaking={stopSpeaking}
              isSupported={isSupported}
              transcript={transcript}
              networkError={networkError}
            />

            {state === 'idle' && !messages.length && (
              <button
                onClick={greet}
                className="px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-white/80 text-xs sm:text-sm transition-all duration-300 border border-white/20 backdrop-blur-sm"
              >
                Sapa Saya
              </button>
            )}
          </div>

        </div>
      </main>

      {/* Footer - Sembunyi saat Landscape Mobile agar layar lega */}
      <footer className="relative z-10 text-center py-3 shrink-0 landscape:hidden md:landscape:block">
        <p className="text-white/30 text-[10px] sm:text-xs">
         © 2026 PT Utero Kreatif Indonesia X POLINEMA DEV
        </p>
      </footer>
    </div>
  );
}