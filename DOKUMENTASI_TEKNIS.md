# Dokumentasi Teknis: Utero Interactive AI

**Versi Dokumen:** 1.0.0  
**Tanggal:** 31 Januari 2026  
**Penulis:** Technical Documentation Team  
**Status:** Final

---

## Daftar Isi

1. [Tinjauan Umum (Overview)](#1-tinjauan-umum-overview)
2. [Arsitektur Teknis (Technical Architecture)](#2-arsitektur-teknis-technical-architecture)
3. [Infrastruktur & Backend](#3-infrastruktur--backend)
4. [Implementasi Kecerdasan Buatan (AI Core)](#4-implementasi-kecerdasan-buatan-ai-core)
5. [Komponen Frontend](#5-komponen-frontend)
6. [Alur Kerja Sistem (System Flow)](#6-alur-kerja-sistem-system-flow)
7. [Panduan Deployment](#7-panduan-deployment)
8. [Kesimpulan & Skalabilitas](#8-kesimpulan--skalabilitas)

---

## 1. Tinjauan Umum (Overview)

### 1.1 Ringkasan Eksekutif

**Utero Interactive AI** adalah sistem asisten virtual berbasis web yang dirancang khusus untuk merepresentasikan **PT Utero Kreatif Indonesia** — sebuah Creative Agency legendaris yang telah berdiri sejak tahun 1998. Sistem ini menghadirkan pengalaman interaksi yang unik di mana pengguna tidak mengetik, melainkan **berbicara langsung (*Voice-Only Interaction*)** dengan Avatar Virtual.

### 1.2 Tujuan Utama

| Aspek | Deskripsi |
|-------|-----------|
| **Representasi Brand** | Menjadi Virtual Representative resmi PT Utero Kreatif Indonesia |
| **User Experience** | Menyediakan antarmuka percakapan berbasis suara yang natural dan intuitif |
| **Domain Focus** | Menjawab pertanyaan spesifik seputar layanan, portofolio, dan informasi perusahaan Utero |
| **Accessibility** | Memungkinkan interaksi hands-free tanpa perlu mengetik |

### 1.3 Fitur Utama

- **🎙️ Voice-Only Interaction**: Sistem menggunakan Speech-to-Text (STT) untuk mendengar user dan Text-to-Speech (TTS) untuk menjawab
- **🛡️ Strict Domain Guardrails**: AI hanya menjawab pertanyaan seputar PT Utero Kreatif Indonesia; pertanyaan di luar topik ditolak secara otomatis
- **🧠 Multi-Provider AI**: Mendukung multiple AI providers (OpenRouter dan Google Gemini) dengan fallback mechanism
- **🇮🇩 Full Indonesian Support**: Dioptimalkan untuk memahami dan merespons dalam Bahasa Indonesia yang natural
- **🎨 Modern UI/UX**: Tampilan dengan tema merah elegan, efek glassmorphism, dan animasi smooth

### 1.4 Target Pengguna

- Calon klien yang ingin mengetahui informasi tentang PT Utero Kreatif Indonesia
- Pengunjung website yang membutuhkan informasi layanan dan kontak
- Siapa saja yang tertarik dengan jasa creative agency Utero

---

## 2. Arsitektur Teknis (Technical Architecture)

### 2.1 Core Engine & Framework

**Utero Interactive AI** dibangun menggunakan stack teknologi modern berbasis JavaScript/TypeScript:

| Komponen | Teknologi | Versi | Alasan Pemilihan |
|----------|-----------|-------|------------------|
| **Framework** | Next.js | 16.1.5 | App Router architecture, server-side rendering, API routes built-in |
| **Runtime** | React | 19.2.3 | Component-based architecture, hooks untuk state management |
| **Language** | TypeScript | 5.x | Type safety, better developer experience, reduced runtime errors |
| **Styling** | Tailwind CSS | 4.1.18 | Utility-first CSS, rapid UI development, responsive design |
| **Icons** | Lucide React | 0.563.0 | Lightweight, tree-shakeable icon library |

#### Mengapa Next.js 16?

1. **App Router**: Arsitektur routing modern dengan layout nesting dan server components
2. **API Routes**: Built-in serverless functions untuk backend logic tanpa setup terpisah
3. **Optimized Performance**: Automatic code splitting, image optimization
4. **TypeScript First**: Native TypeScript support tanpa konfigurasi tambahan
5. **Edge Runtime**: Kemampuan deployment ke edge untuk latency rendah

### 2.2 Application Lifecycle

```
┌─────────────────────────────────────────────────────────────────────┐
│                        APPLICATION LIFECYCLE                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. INITIALIZATION                                                   │
│     └── Next.js App Bootstrap                                       │
│         ├── Load Environment Variables (.env)                       │
│         ├── Initialize React Components                             │
│         └── Setup Speech APIs (STT/TTS)                             │
│                                                                      │
│  2. IDLE STATE                                                       │
│     └── Avatar menampilkan animasi floating                         │
│         └── Menunggu user menekan tombol mikrofon                   │
│                                                                      │
│  3. LISTENING STATE                                                  │
│     └── Web Speech API aktif mendengarkan                           │
│         ├── Transcript ditampilkan real-time                        │
│         └── Debounce 2.5 detik untuk finalisasi input               │
│                                                                      │
│  4. PROCESSING STATE                                                 │
│     └── Request dikirim ke API Route                                │
│         ├── System Prompt di-inject                                 │
│         ├── History percakapan disertakan                           │
│         └── AI Provider memproses request                           │
│                                                                      │
│  5. SPEAKING STATE                                                   │
│     └── Response disampaikan via TTS                                │
│         ├── Avatar animasi berbicara (lip-sync)                     │
│         └── Setelah selesai, kembali ke IDLE                        │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### 2.3 Bahasa & Standar Pengembangan

#### TypeScript Configuration

```json
{
  "compilerOptions": {
    "target": "ES2017",
    "lib": ["dom", "dom.iterable", "esnext"],
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "strict": true,
    "noEmit": true,
    "jsx": "preserve",
    "incremental": true,
    "paths": {
      "@/*": ["./src/*"]
    }
  }
}
```

#### Path Aliases

| Alias | Path | Deskripsi |
|-------|------|-----------|
| `@/components` | `./src/components/*` | UI Components |
| `@/hooks` | `./src/hooks/*` | Custom React Hooks |
| `@/types` | `./src/types/*` | TypeScript Type Definitions |
| `@/constants` | `./src/constants/*` | Constants & Configuration |

#### Coding Standards

- **Naming Convention**: PascalCase untuk komponen, camelCase untuk fungsi/variabel
- **Component Pattern**: Functional components dengan React Hooks
- **State Management**: Local state via `useState`, side effects via `useEffect`
- **Error Handling**: Try-catch blocks dengan fallback mechanism
- **Logging**: Console logging dengan prefix `[Module]` untuk debugging

---

## 3. Infrastruktur & Backend

### 3.1 Topologi Server

#### Arsitektur Saat Ini (Development/Production)

```
┌──────────────────────────────────────────────────────────────────────┐
│                         DEPLOYMENT TOPOLOGY                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│    ┌─────────────┐                                                    │
│    │   CLIENT    │                                                    │
│    │  (Browser)  │                                                    │
│    └──────┬──────┘                                                    │
│           │ HTTPS                                                     │
│           ▼                                                           │
│    ┌─────────────────────────────────────────────┐                   │
│    │           VERCEL EDGE NETWORK               │                   │
│    │  ┌────────────────────────────────────────┐ │                   │
│    │  │        Next.js Application             │ │                   │
│    │  │  ┌─────────────┐  ┌─────────────────┐  │ │                   │
│    │  │  │  Frontend   │  │   API Routes    │  │ │                   │
│    │  │  │   (React)   │  │ (/api/chat)     │  │ │                   │
│    │  │  └─────────────┘  └────────┬────────┘  │ │                   │
│    │  └────────────────────────────┼───────────┘ │                   │
│    └───────────────────────────────┼─────────────┘                   │
│                                    │                                  │
│                    ┌───────────────┴───────────────┐                 │
│                    ▼                               ▼                  │
│         ┌─────────────────────┐       ┌─────────────────────┐        │
│         │   OpenRouter API    │       │   Google Gemini     │        │
│         │  (Primary Provider) │       │  (Backup Provider)  │        │
│         └─────────────────────┘       └─────────────────────┘        │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

#### Rencana Future (Server Internal)

Untuk deployment ke server internal perusahaan, arsitektur dapat dimodifikasi:

```
┌──────────────────────────────────────────────────────────────────────┐
│                    INTERNAL SERVER TOPOLOGY                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│    ┌─────────────┐                                                    │
│    │   CLIENT    │                                                    │
│    └──────┬──────┘                                                    │
│           │ HTTPS/HTTP                                                │
│           ▼                                                           │
│    ┌─────────────────────────────────────────────┐                   │
│    │         NGINX / REVERSE PROXY               │                   │
│    │         (Load Balancer + SSL)               │                   │
│    └──────────────────┬──────────────────────────┘                   │
│                       │                                               │
│           ┌───────────┴───────────┐                                  │
│           ▼                       ▼                                   │
│    ┌─────────────┐         ┌─────────────┐                           │
│    │  Node.js    │         │  Node.js    │                           │
│    │  Instance 1 │         │  Instance 2 │                           │
│    └─────────────┘         └─────────────┘                           │
│                                                                       │
│    Managed by: PM2 / Docker Compose / Kubernetes                     │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

#### Spesifikasi Minimum Server

| Komponen | Minimum | Recommended |
|----------|---------|-------------|
| **CPU** | 2 vCPU | 4 vCPU |
| **RAM** | 2 GB | 4 GB |
| **Storage** | 20 GB SSD | 50 GB SSD |
| **Network** | 100 Mbps | 1 Gbps |
| **Node.js** | v18.x LTS | v20.x LTS |

### 3.2 Komunikasi Data

#### API Route: `/api/chat`

**Endpoint**: `POST /api/chat`

**Request Body**:
```typescript
interface ChatRequest {
    message: string;          // Pesan user
    model?: string;           // Model ID (optional)
    provider?: AIProvider;    // 'openrouter' | 'gemini'
    history?: ChatMessage[];  // Riwayat percakapan (max 10 terakhir)
}
```

**Response Body**:
```typescript
interface ChatResponse {
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
    _usedModel: string;  // Model yang benar-benar digunakan (setelah fallback)
}
```

#### Health Check Endpoint

**Endpoint**: `GET /api/chat`

**Response**:
```json
{
    "status": "ok",
    "message": "Utero AI Chat API is running",
    "hasGeminiKey": true,
    "hasOpenRouterKey": true,
    "defaultModel": "nvidia/nemotron-nano-9b-v2:free",
    "availableModels": [...]
}
```

#### Protokol Komunikasi

| Protokol | Digunakan Untuk | Keterangan |
|----------|-----------------|------------|
| **HTTPS** | Client ↔ Server | Encrypted communication |
| **REST API** | Frontend ↔ Backend | JSON payload via fetch API |
| **WebSocket** | Future (real-time) | Planned for streaming responses |
| **Web Speech API** | Browser-based STT/TTS | Native browser API |

---

## 4. Implementasi Kecerdasan Buatan (AI Core)

### 4.1 Model Architecture

Utero Interactive AI menggunakan arsitektur **Multi-Provider AI** dengan mekanisme fallback otomatis:

```
┌──────────────────────────────────────────────────────────────────────┐
│                      AI PROVIDER ARCHITECTURE                         │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│    ┌─────────────────────────────────────────────────────────────┐   │
│    │                    PRIMARY: OpenRouter                       │   │
│    │  ┌───────────────────────────────────────────────────────┐  │   │
│    │  │  Available Models (Free Tier):                        │  │   │
│    │  │  ├── NVIDIA Nemotron Nano 9B V2 (Default, Most Stable)│  │   │
│    │  │  ├── Qwen 3 4B (Fast & Lightweight)                   │  │   │
│    │  │  ├── OpenAI GPT-OSS 120B                              │  │   │
│    │  │  ├── Google Gemma 3 27B/12B Instruct                  │  │   │
│    │  │  ├── Meta Llama 3.3 70B Instruct                      │  │   │
│    │  │  ├── DeepSeek R1 (Reasoning Model)                    │  │   │
│    │  │  └── Meta Llama 3.1 405B (Largest)                    │  │   │
│    │  └───────────────────────────────────────────────────────┘  │   │
│    └─────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│                              │ Fallback on Error (404/429/503)        │
│                              ▼                                        │
│    ┌─────────────────────────────────────────────────────────────┐   │
│    │                    BACKUP: Google Gemini                     │   │
│    │  ┌───────────────────────────────────────────────────────┐  │   │
│    │  │  Available Models:                                    │  │   │
│    │  │  ├── Gemini 2.0 Flash (Latest & Fast)                 │  │   │
│    │  │  ├── Gemini 1.5 Flash (Balanced)                      │  │   │
│    │  │  └── Gemini 1.5 Pro (Most Capable)                    │  │   │
│    │  └───────────────────────────────────────────────────────┘  │   │
│    └─────────────────────────────────────────────────────────────┘   │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

#### Model Configuration

```typescript
export interface AIModel {
   id: string;
   name: string;
   provider: 'openrouter' | 'gemini';
   description: string;
   isFree?: boolean; 
}

// Default model (most stable)
export const DEFAULT_MODEL = 'nvidia/nemotron-nano-9b-v2:free';
export const DEFAULT_PROVIDER: AIProvider = 'openrouter';
```

#### Fallback Strategy

Jika model utama gagal (error 404, 429, atau 503), sistem akan mencoba model fallback secara berurutan:

1. `nvidia/nemotron-nano-9b-v2:free`
2. `qwen/qwen3-4b:free`
3. `openai/gpt-oss-120b:free`
4. `google/gemma-3-27b-it:free`
5. `google/gemma-3-12b-it:free`
6. `meta-llama/llama-3.3-70b-instruct:free`

### 4.2 System Prompting (The Brain)

Utero AI menggunakan teknik **System Prompting** untuk membentuk kepribadian dan batasan AI:

#### Struktur System Prompt

```
┌──────────────────────────────────────────────────────────────────────┐
│                         SYSTEM PROMPT STRUCTURE                       │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  1. PERAN (Role Definition)                                          │
│     └── Virtual Representative PT Utero Kreatif Indonesia            │
│                                                                       │
│  2. DEFINISI KONTEKS                                                  │
│     └── "Utero" = PT Utero Kreatif Indonesia (BUKAN istilah medis)   │
│                                                                       │
│  3. INFORMASI LENGKAP PERUSAHAAN                                      │
│     ├── Profil Perusahaan                                            │
│     ├── Kontak Resmi (Telepon, Website, Alamat)                      │
│     ├── Jam Operasional                                              │
│     ├── Divisi dan Unit Usaha (Utero Group)                          │
│     ├── Cabang Utero                                                 │
│     ├── Layanan Lengkap                                              │
│     ├── Keunggulan Utama (USP)                                       │
│     └── Filosofi Perusahaan                                          │
│                                                                       │
│  4. ATURAN UTAMA                                                      │
│     ├── FOKUS ABSOLUT: Hanya topik Utero                             │
│     ├── PEMBATASAN: Tolak pertanyaan di luar topik                   │
│     └── FORMAT JAWABAN: Optimized untuk TTS                          │
│                                                                       │
│  5. CONTOH RESPONS                                                    │
│     └── Template jawaban untuk pertanyaan umum                       │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

#### Key Features System Prompt

| Feature | Deskripsi |
|---------|-----------|
| **Domain Lock** | AI hanya menjawab pertanyaan tentang Utero |
| **Context Redefinition** | Kata "Utero" = PT Utero Kreatif Indonesia |
| **TTS Optimization** | Output tanpa markdown symbols (*, #, -, dll) |
| **Natural Transitions** | "Pertama, Kedua, Selanjutnya, Yang terakhir" |
| **Polite Rejection** | Template untuk menolak pertanyaan off-topic |

### 4.3 Pipeline Pemrosesan (Inference Pipeline)

```
┌──────────────────────────────────────────────────────────────────────┐
│                      INFERENCE PIPELINE                               │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  STEP 1: VOICE INPUT                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  User berbicara → Web Speech API (STT) → Raw Transcript         │ │
│  │  Language: id-ID (Indonesian)                                   │ │
│  │  Continuous: true (multiple sentences allowed)                  │ │
│  │  Debounce: 2500ms (wait for user to finish speaking)           │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                               │                                       │
│                               ▼                                       │
│  STEP 2: MESSAGE CONSTRUCTION                                         │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Messages Array = [                                             │ │
│  │    { role: 'system', content: getSystemPrompt() },              │ │
│  │    ...history.slice(-10),  // Last 10 messages                  │ │
│  │    { role: 'user', content: userMessage }                       │ │
│  │  ]                                                              │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                               │                                       │
│                               ▼                                       │
│  STEP 3: API REQUEST                                                  │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  POST /api/chat                                                 │ │
│  │  Headers: Authorization, Content-Type, HTTP-Referer, X-Title   │ │
│  │  Body: { message, model, provider, history }                    │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                               │                                       │
│                               ▼                                       │
│  STEP 4: AI INFERENCE                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  OpenRouter/Gemini API Processing                               │ │
│  │  Parameters:                                                    │ │
│  │    - max_tokens: 500                                            │ │
│  │    - temperature: 0.7                                           │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                               │                                       │
│                               ▼                                       │
│  STEP 5: RESPONSE CLEANING                                            │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  cleanTextForTTS(response):                                     │ │
│  │    - Remove <think>...</think> tags                             │ │
│  │    - Remove markdown: **, *, __, _, #, `, ```                   │ │
│  │    - Remove bullet points: -, *, +, 1.                          │ │
│  │    - Normalize whitespace                                       │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                               │                                       │
│                               ▼                                       │
│  STEP 6: VOICE OUTPUT                                                 │
│  ┌─────────────────────────────────────────────────────────────────┐ │
│  │  Web Speech API (TTS) → SpeechSynthesisUtterance                │ │
│  │  Language: id-ID (Indonesian voice preferred)                   │ │
│  │  Rate: 1.0, Pitch: 1.0, Volume: 1.0                             │ │
│  │  Avatar lip-sync animation synchronized                         │ │
│  └─────────────────────────────────────────────────────────────────┘ │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 5. Komponen Frontend

### 5.1 Struktur Direktori

```
src/
├── app/
│   ├── api/
│   │   └── chat/
│   │       └── route.ts       # API Route untuk AI inference
│   ├── globals.css            # Global CSS dengan Tailwind
│   ├── layout.tsx             # Root layout
│   ├── logo.png               # Logo Utero
│   └── page.tsx               # Halaman utama
├── components/
│   ├── AvatarCanvas.tsx       # Visual Avatar dengan Canvas 2D
│   ├── ChatBubble.tsx         # Bubble chat untuk percakapan
│   ├── ModelSelector.tsx      # Dropdown pemilihan model AI
│   ├── VoiceControl.tsx       # Kontrol mikrofon & status
│   └── index.ts               # Barrel export
├── constants/
│   └── ai.ts                  # System Prompt & AI Configuration
├── hooks/
│   └── useVoiceAI.ts          # Custom hook untuk voice AI logic
└── types/
    └── index.ts               # TypeScript type definitions
```

### 5.2 Komponen Utama

#### AvatarCanvas.tsx

Komponen visual avatar yang menampilkan representasi AI dengan animasi berbasis Canvas 2D.

**Props**:
```typescript
interface AvatarCanvasProps {
    state: VoiceState;  // 'idle' | 'listening' | 'processing' | 'speaking'
    className?: string;
}
```

**Fitur**:
- Animasi floating (naik-turun halus)
- Glow effect berdasarkan state (merah/hijau/kuning/rose)
- Lip-sync animation saat speaking
- Blinking animation untuk mata
- Pulsing dots animation untuk listening/speaking states
- State indicator ring dengan animasi dash

**Color Scheme**:
| State | Glow Color |
|-------|------------|
| idle | `rgba(185, 28, 28, 0.3)` - Red |
| listening | `rgba(34, 197, 94, 0.5)` - Green |
| processing | `rgba(234, 179, 8, 0.5)` - Yellow |
| speaking | `rgba(244, 63, 94, 0.5)` - Rose |

#### VoiceControl.tsx

Kontrol mikrofon dengan UI yang dinamis untuk interaksi suara.

**Props**:
```typescript
interface VoiceControlProps {
    state: VoiceState;
    onStart: () => void;
    onStop: () => void;
    onStopSpeaking?: () => void;
    isSupported: boolean;
    transcript?: string;
    networkError?: boolean;
}
```

**Fitur**:
- Single unified button untuk semua state
- Dynamic icon (mic/stop)
- Pulse animations berdasarkan state
- Real-time transcript preview
- Network error indicator
- Audio wave animation saat listening

#### ChatBubble.tsx

Menampilkan riwayat percakapan dalam format bubble chat.

**Fitur**:
- User messages (kanan, gradient merah)
- Assistant messages (kiri, gradient gelap)
- Auto-scroll ke pesan terbaru
- Custom scrollbar styling

#### ModelSelector.tsx

Dropdown untuk memilih model AI yang akan digunakan.

**Fitur**:
- Grouped by provider (OpenRouter/Gemini)
- Free tier indicator
- Disabled saat tidak dalam idle state

### 5.3 Custom Hooks

#### useVoiceAI.ts

Custom hook yang mengelola seluruh logic voice AI.

**Return Values**:
```typescript
interface UseVoiceAIReturn {
    state: VoiceState;           // Current state
    transcript: string;          // Current STT transcript
    response: string;            // AI response
    isSupported: boolean;        // Browser support check
    startListening: () => void;  // Start STT
    stopListening: () => void;   // Stop STT
    speak: (text: string) => void; // Initiate TTS
    stopSpeaking: () => void;    // Cancel TTS
    messages: Message[];         // Conversation history
    greet: () => void;          // Play greeting message
    currentModel: string;        // Selected AI model
    setCurrentModel: (id: string) => void;
    networkError: boolean;       // Network error flag
}
```

**Configuration Constants**:
```typescript
const SPEECH_DELAY_MS = 2500;      // Debounce delay
const MAX_NETWORK_RETRIES = 3;     // Retry attempts
const RETRY_DELAY_BASE_MS = 1000;  // Base retry delay
```

### 5.4 Type Definitions

```typescript
// Voice AI State Types
export type VoiceState = 'idle' | 'listening' | 'processing' | 'speaking';

export interface Message {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface ChatResponse {
    id: string;
    choices: {
        message: { role: string; content: string; };
        finish_reason: string;
    }[];
    model: string;
    usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
    };
}

// Avatar animation states
export type AvatarMood = 'neutral' | 'happy' | 'thinking' | 'speaking';
```

---

## 6. Alur Kerja Sistem (System Flow)

### 6.1 Sequence Diagram

```
┌─────────┐     ┌─────────────┐     ┌─────────────┐     ┌───────────┐
│  User   │     │  Frontend   │     │  API Route  │     │ AI Provider│
│         │     │  (React)    │     │ (/api/chat) │     │           │
└────┬────┘     └──────┬──────┘     └──────┬──────┘     └─────┬─────┘
     │                 │                   │                  │
     │  1. Click Mic   │                   │                  │
     │────────────────>│                   │                  │
     │                 │                   │                  │
     │  2. Speak       │                   │                  │
     │────────────────>│                   │                  │
     │                 │                   │                  │
     │                 │ 3. STT Processing │                  │
     │                 │ (Web Speech API)  │                  │
     │                 │                   │                  │
     │                 │ 4. POST /api/chat │                  │
     │                 │──────────────────>│                  │
     │                 │                   │                  │
     │                 │                   │ 5. Forward to AI │
     │                 │                   │─────────────────>│
     │                 │                   │                  │
     │                 │                   │ 6. AI Response   │
     │                 │                   │<─────────────────│
     │                 │                   │                  │
     │                 │ 7. JSON Response  │                  │
     │                 │<──────────────────│                  │
     │                 │                   │                  │
     │                 │ 8. TTS Processing │                  │
     │                 │ (Web Speech API)  │                  │
     │                 │                   │                  │
     │  9. Audio Output│                   │                  │
     │<────────────────│                   │                  │
     │                 │                   │                  │
```

### 6.2 State Machine

```
                    ┌─────────────────────────────────────────┐
                    │                                         │
                    ▼                                         │
              ┌──────────┐                                    │
              │   IDLE   │◄──────────────────────────────────┐│
              └────┬─────┘                                   ││
                   │                                         ││
                   │ startListening()                        ││
                   ▼                                         ││
              ┌──────────┐                                   ││
         ┌───►│LISTENING │                                   ││
         │    └────┬─────┘                                   ││
         │         │                                         ││
         │         │ stopListening() OR                      ││
         │         │ processMessage()                        ││
         │         ▼                                         ││
         │    ┌──────────┐                                   ││
         │    │PROCESSING│                                   ││
         │    └────┬─────┘                                   ││
         │         │                                         ││
Network  │         │ speak(response)                         ││
Retry    │         ▼                                         ││
         │    ┌──────────┐                                   ││
         └────│ SPEAKING │───────────────────────────────────┘│
              └────┬─────┘                                    │
                   │                                          │
                   │ utterance.onend OR                       │
                   │ stopSpeaking()                           │
                   │                                          │
                   └──────────────────────────────────────────┘
```

---

## 7. Panduan Deployment

### 7.1 Environment Variables

Buat file `.env` berdasarkan `.env.example`:

```env
# Gemini API Key (from Google AI Studio: https://aistudio.google.com/apikey)
GEMINI_API_KEY=your_gemini_api_key_here

# OpenRouter API Key (from https://openrouter.ai)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Site URL
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**Catatan**: Minimal satu API key (GEMINI atau OPENROUTER) harus dikonfigurasi.

### 7.2 Deployment ke Vercel (Current)

```bash
# Install Vercel CLI
npm install -g vercel

# Login ke Vercel
vercel login

# Deploy
vercel --prod

# Set environment variables di Vercel Dashboard
# Settings > Environment Variables
```

### 7.3 Deployment ke Server Internal (Future)

#### Option A: PM2

```bash
# Install dependencies
npm install

# Build production
npm run build

# Install PM2
npm install -g pm2

# Start dengan PM2
pm2 start npm --name "utero-ai" -- start

# Enable auto-restart
pm2 startup
pm2 save
```

#### Option B: Docker

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
CMD ["node", "server.js"]
```

```bash
# Build & Run
docker build -t utero-ai .
docker run -p 3000:3000 --env-file .env utero-ai
```

### 7.4 Browser Compatibility

| Browser | STT Support | TTS Support | Overall |
|---------|-------------|-------------|---------|
| **Google Chrome** | ✅ Full | ✅ Full | ✅ Recommended |
| **Microsoft Edge** | ✅ Full | ✅ Full | ✅ Recommended |
| **Firefox** | ⚠️ Partial | ✅ Full | ⚠️ Limited |
| **Safari** | ⚠️ Partial | ✅ Full | ⚠️ Limited |

---

## 8. Kesimpulan & Skalabilitas

### 8.1 Ringkasan Teknis

Utero Interactive AI adalah solusi Voice-First AI Assistant yang dibangun dengan teknologi modern:

- **Frontend**: Next.js 16 + React 19 + TypeScript
- **Styling**: Tailwind CSS 4 dengan glassmorphism design
- **AI**: Multi-provider (OpenRouter + Gemini) dengan fallback mechanism
- **Voice**: Web Speech API (STT/TTS) native browser
- **Deployment**: Vercel (current) dengan rencana migrasi ke server internal

### 8.2 Potensi Pengembangan Fitur

#### Short-term Improvements

| Fitur | Deskripsi | Prioritas |
|-------|-----------|-----------|
| **Streaming Response** | Real-time streaming untuk respons AI yang lebih cepat | High |
| **Voice Cloning** | Custom voice untuk brand consistency | Medium |
| **Multi-language** | Support bahasa lain (English, etc.) | Medium |
| **Analytics Dashboard** | Tracking percakapan dan user engagement | Low |

#### Long-term Vision

| Fitur | Deskripsi | Timeline |
|-------|-----------|----------|
| **3D Avatar** | Upgrade dari Canvas 2D ke Three.js/WebGL | Q2 2026 |
| **RAG Integration** | Retrieval Augmented Generation dengan knowledge base | Q3 2026 |
| **WhatsApp Integration** | Voice bot via WhatsApp Business API | Q4 2026 |
| **Mobile App** | React Native standalone app | 2027 |

### 8.3 Skalabilitas Arsitektur

```
┌──────────────────────────────────────────────────────────────────────┐
│                      SCALABILITY ROADMAP                              │
├──────────────────────────────────────────────────────────────────────┤
│                                                                       │
│  CURRENT (v1.0)                                                       │
│  ├── Single Vercel deployment                                        │
│  ├── External AI providers only                                      │
│  └── Estimated capacity: ~100 concurrent users                       │
│                                                                       │
│  PHASE 2 (v2.0)                                                       │
│  ├── Internal server dengan load balancer                            │
│  ├── Redis caching untuk session management                          │
│  ├── Database untuk conversation history                             │
│  └── Estimated capacity: ~1000 concurrent users                      │
│                                                                       │
│  PHASE 3 (v3.0)                                                       │
│  ├── Kubernetes orchestration                                        │
│  ├── Self-hosted LLM (fine-tuned)                                    │
│  ├── CDN untuk static assets                                         │
│  ├── Multi-region deployment                                         │
│  └── Estimated capacity: ~10000+ concurrent users                    │
│                                                                       │
└──────────────────────────────────────────────────────────────────────┘
```

### 8.4 Rekomendasi Teknis

1. **Migrasi Server**: Prioritaskan migrasi ke server internal untuk mengurangi latency dan meningkatkan kontrol data
2. **API Key Management**: Implementasi key rotation dan secret management (HashiCorp Vault)
3. **Monitoring**: Setup observability stack (Prometheus + Grafana) untuk production monitoring
4. **Backup Strategy**: Implementasi backup regular untuk conversation history
5. **Security Audit**: Lakukan penetration testing sebelum production release

---

## Appendix

### A. Referensi API

| Provider | Documentation URL |
|----------|-------------------|
| OpenRouter | https://openrouter.ai/docs |
| Google Gemini | https://ai.google.dev/docs |
| Web Speech API | https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API |

### B. Kontak Pengembang

- **Repository**: UTERO/Utero_AI
- **Technical Lead**: POLINEMA DEV Team
- **Client**: PT Utero Kreatif Indonesia

---

**Dokumen ini dibuat dengan ❤️ untuk PT Utero Kreatif Indonesia X POLINEMA DEV © 2026**
