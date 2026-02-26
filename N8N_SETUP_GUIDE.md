# 🧠 Panduan Setup n8n sebagai AI Brain untuk CarubaAI

## Arsitektur

```
Browser (STT) → Next.js /api/chat → n8n Webhook → AI Agent → Response text → Next.js → Browser (TTS)
                (hanya proxy)              ↑
                                     AI Agent memilih
                                     tool/database yang
                                     tepat berdasarkan
                                     topik pertanyaan
```

**Web app TIDAK memiliki API key atau logika AI.**
Semua kecerdasan ada di n8n.

---

## 📋 Step-by-Step Setup n8n Workflow

### Step 1: Webhook Node (Trigger)

1. Tambahkan node **Webhook**
2. Konfigurasi:
   - **HTTP Method**: `POST`
   - **Path**: `caruba-agent` (URL akan menjadi `https://n8n.klikus.xyz/webhook/caruba-agent`)
   - **Response Mode**: `Last Node` (agar response dari AI Agent dikirim kembali)
   - **Response Data**: `JSON`

3. Data yang diterima dari web:
```json
{
  "message": "Apa itu Utero?",
  "history": [
    { "role": "user", "content": "Halo" },
    { "role": "assistant", "content": "Halo! Ada yang bisa saya bantu?" }
  ],
  "sessionId": "session-1708xxx-abc123"
}
```

---

### Step 2: Edit Fields Node (Prepare Data)

1. Tambahkan node **Edit Fields** setelah Webhook
2. Mode: **Manual Mapping**
3. Set field:
   - `chatInput` = `{{ $json.body.message }}` (ini yang akan dibaca AI Agent)
   - `sessionId` = `{{ $json.body.sessionId }}` (untuk memory per session)

> **Penting:** AI Agent node di n8n membaca field bernama `chatInput` secara default.

---

### Step 3: AI Agent Node (Otak AI)

1. Tambahkan node **AI Agent**
2. Konfigurasi utama:
   - **Agent Type**: `Tools Agent` (agar bisa menggunakan multiple tools)
   - **Prompt / System Message**: (lihat di bawah)
   - **Input Text**: `{{ $json.chatInput }}`

#### System Prompt untuk AI Agent:

```
PERAN:
Kamu adalah CarubaAI, Virtual Representative resmi dari PT Utero Kreatif Indonesia, sebuah Creative Agency legendaris yang telah berdiri sejak tahun 1998. Kamu bertugas menjawab pertanyaan seputar perusahaan dengan ramah dan profesional.

PENTING - DEFINISI "UTERO":
Dalam konteks percakapan ini, kata "Utero" SELALU dan HANYA merujuk pada PT Utero Kreatif Indonesia.
JANGAN PERNAH menyebutkan atau menjelaskan bahwa "utero" adalah istilah biologi/medis.

INSTRUKSI PENGGUNAAN TOOL:
Kamu HARUS menggunakan tool yang tersedia untuk mencari informasi sebelum menjawab. Jangan mengarang jawaban.
Pilih tool yang paling relevan berdasarkan topik pertanyaan user.
Jika tidak ada informasi di tool, sampaikan dengan sopan bahwa kamu belum memiliki informasi tersebut.

FORMAT JAWABAN UNTUK TTS:
DILARANG menggunakan simbol apapun seperti tanda bintang, pagar, strip, atau simbol formatting.
Gunakan kata transisi natural: Pertama, Kedua, Selanjutnya, Yang terakhir.
Jawaban singkat dan padat, maksimal 3-4 kalimat untuk pertanyaan sederhana.
Tulis angka dengan cara yang natural untuk dibaca.

FOKUS ABSOLUT: Jawab HANYA pertanyaan tentang PT Utero Kreatif Indonesia. Tolak dengan sopan pertanyaan di luar topik.
```

---

### Step 4: Chat Model (Sub-node AI Agent)

1. Klik **"+"** di bawah "Chat Model" pada AI Agent
2. Pilih **Google Gemini Chat Model**
3. Konfigurasi:
   - **Credential**: Buat credential Google Gemini dengan API key Anda
   - **Model**: `gemini-2.0-flash`
   - **Temperature**: `0.7`
   - **Max Output Tokens**: `500`

---

### Step 5: Memory (Sub-node AI Agent)

1. Klik **"+"** di bawah "Memory" pada AI Agent
2. Pilih **Window Buffer Memory**
3. Konfigurasi:
   - **Session ID**: `{{ $json.sessionId }}` (dari Edit Fields)
   - **Context Window Length**: `10` (simpan 10 pesan terakhir)

> Ini membuat AI "ingat" percakapan sebelumnya per user session.

---

### Step 6: Tools (Sub-node AI Agent) — SMART DOCUMENT ROUTING

Ini bagian **paling penting** — AI akan **otomatis memilih** tool yang tepat berdasarkan pertanyaan.

#### Tool 1: FAQ (Google Sheets)
1. Klik **"+"** di bawah "Tool" pada AI Agent
2. Pilih **Google Sheets Tool** (Read Sheet)
3. Konfigurasi:
   - **Name**: `faq_utero`
   - **Description**: ⚡ **INI KUNCI ROUTING** ⚡
     ```
     Gunakan tool ini untuk menjawab pertanyaan umum (FAQ) tentang Utero Indonesia.
     Contoh: jam buka, alamat kantor, nomor telepon, kontak, website, sosial media,
     sejarah singkat perusahaan, cara menghubungi, lokasi cabang.
     ```
   - **Document**: Link Google Sheet FAQ Anda
   - **Sheet**: Nama sheet yang berisi FAQ

#### Tool 2: Harga/Pricing (Google Sheets)
1. Tambah tool **Google Sheets**
2. Konfigurasi:
   - **Name**: `harga_layanan`
   - **Description**:
     ```
     Gunakan tool ini HANYA ketika user bertanya tentang harga, biaya, tarif, pricing,
     berapa biaya, budget, estimasi biaya, pecah harga, atau perbandingan harga layanan Utero.
     Tool ini berisi daftar harga untuk semua layanan seperti desain, branding, billboard,
     printing, dan lainnya.
     ```
   - **Document**: Link Google Sheet Harga Anda

#### Tool 3: Services/Layanan (Google Sheets)
1. Tambah tool **Google Sheets**
2. Konfigurasi:
   - **Name**: `layanan_utero`
   - **Description**:
     ```
     Gunakan tool ini ketika user bertanya tentang layanan, jasa, service, divisi,
     apa yang ditawarkan Utero, jenis pekerjaan yang bisa dikerjakan, kemampuan Utero,
     portofolio layanan, paket layanan, atau spesifikasi layanan.
     ```
   - **Document**: Link Google Sheet Layanan Anda

#### Tool 4: Data Customer (Google Sheets)
1. Tambah tool **Google Sheets**
2. Konfigurasi:
   - **Name**: `data_customer`
   - **Description**:
     ```
     Gunakan tool ini ketika user bertanya tentang klien, pelanggan, customer, mitra,
     partner, brand yang pernah ditangani, atau referensi pekerjaan sebelumnya.
     ```
   - **Document**: Link Google Sheet Customer Anda

#### Tool 5: Knowledge Base (Vector Store / Embeddings)
1. Tambah tool **Vector Store Tool**
2. Konfigurasi:
   - **Name**: `knowledge_base_utero`
   - **Description**:
     ```
     Gunakan tool ini untuk pertanyaan mendalam yang membutuhkan informasi detail tentang
     Utero Indonesia yang tidak ada di tool lain. Misalnya: filosofi perusahaan, keunggulan
     kompetitif, sejarah panjang, visi misi, budaya kerja, proses kerja, metodologi,
     sertifikasi, penghargaan, atau informasi detail lainnya.
     ```
   - **Vector Store**: Buat menggunakan n8n In-Memory Vector Store atau Pinecone/Supabase
   - **Embeddings**: Google Gemini Embeddings

   **Cara mengisi Knowledge Base:**
   1. Buat workflow terpisah untuk "Load Documents"
   2. Upload dokumen (PDF, dokumen company profile, dsb)
   3. Gunakan node **Text Splitter** → **Embeddings** → **Vector Store Insert**

#### Tool 6: Database Query (opsional - jika punya database SQL)
1. Tambah tool **Database Query Tool** (PostgreSQL/MySQL)
2. Konfigurasi sesuai database Anda

#### Tool 7: Website Lookup (HTTP Request)
1. Tambah tool **HTTP Request Tool**
2. Konfigurasi:
   - **Name**: `website_utero`
   - **Description**:
     ```
     Gunakan tool ini HANYA ketika perlu informasi terbaru dari website resmi Utero
     yang tidak ada di tool lain. URL: https://uteroindonesia.com atau https://utero.id
     ```
   - **URL**: `https://uteroindonesia.com`
   - **Method**: `GET`

---

### Step 7: Format Response (Opsional)

Jika perlu memformat response sebelum dikembalikan ke web:

1. Tambahkan node **Edit Fields** setelah AI Agent
2. Set field:
```json
{
  "output": "{{ $json.output }}"
}
```

Atau untuk format ChatResponse yang lebih lengkap:
```json
{
  "id": "n8n-{{ $now.toMillis() }}",
  "choices": [
    {
      "message": {
        "role": "assistant",
        "content": "{{ $json.output }}"
      },
      "finish_reason": "stop"
    }
  ],
  "model": "n8n-ai-agent",
  "usage": {
    "prompt_tokens": 0,
    "completion_tokens": 0,
    "total_tokens": 0
  }
}
```

---

## 🔑 Bagaimana AI Memilih Tool yang Tepat?

### Mekanisme Tool Calling

AI Agent di n8n menggunakan **Function Calling** dari LLM (Gemini). Prosesnya:

1. User bertanya: "Berapa harga billboard ukuran 3x4?"
2. AI membaca **semua tool descriptions**
3. AI menentukan: "Pertanyaan ini tentang **harga** → gunakan `harga_layanan` tool"
4. AI juga bisa memilih: "Dan ini juga tentang **billboard** → gunakan `layanan_utero` juga"
5. AI menggabungkan hasil dari kedua tool untuk menjawab

### Contoh Routing Otomatis:

| Pertanyaan User | Tool yang Dipilih AI |
|---|---|
| "Jam buka Utero?" | `faq_utero` |
| "Berapa harga desain logo?" | `harga_layanan` |
| "Utero bisa apa saja?" | `layanan_utero` |
| "Siapa saja klien Utero?" | `data_customer` |
| "Apa filosofi Utero?" | `knowledge_base_utero` |
| "Berapa harga billboard dan apa saja ukurannya?" | `harga_layanan` + `layanan_utero` |
| "Kapan Utero didirikan dan apa visinya?" | `faq_utero` + `knowledge_base_utero` |

### Tips Agar Routing Lebih Akurat:

1. **Description tool harus spesifik** — Sertakan kata kunci yang sering ditanyakan user
2. **Hindari overlap antar tool** — Setiap tool harus punya domain yang jelas
3. **Tambahkan contoh dalam description** — "Contoh pertanyaan: berapa harga, tarif, biaya..."
4. **Gunakan frasa negatif** — "JANGAN gunakan tool ini untuk pertanyaan tentang harga"

---

## 📊 Flow Diagram Lengkap

```
[Web Browser]
     │
     │ User bicara → STT (browser) → text
     │
     ▼
[Next.js /api/chat]  ←── Hanya proxy, TANPA API key
     │
     │ POST { message, history, sessionId }
     │
     ▼
[n8n Webhook]
     │
     ▼
[Edit Fields] ── Extract chatInput & sessionId
     │
     ▼
[AI Agent] ─────────────────────────────────────
     │                                          │
     ├── Chat Model: Gemini 2.0 Flash          │
     │   (API key ada di n8n credential)        │
     │                                          │
     ├── Memory: Window Buffer                  │
     │   (per sessionId)                        │
     │                                          │
     └── Tools: AI memilih otomatis             │
         ├── faq_utero (Google Sheets)          │
         ├── harga_layanan (Google Sheets)      │
         ├── layanan_utero (Google Sheets)      │
         ├── data_customer (Google Sheets)      │
         ├── knowledge_base_utero (Vector)      │
         ├── database_query (SQL - opsional)    │
         └── website_utero (HTTP Request)       │
─────────────────────────────────────────────────
     │
     ▼
[Response: { output: "jawaban AI" }]
     │
     ▼
[Next.js /api/chat] ── Format ke ChatResponse
     │
     ▼
[Web Browser] ── TTS (Python backend / Web Speech)
     │
     ▼
User mendengar jawaban 🔊
```

---

## ✅ Checklist Setup

- [ ] Webhook node sudah active dan URL sesuai di `.env` web
- [ ] Edit Fields node mengekstrak `chatInput` dan `sessionId`
- [ ] AI Agent node dikonfigurasi dengan system prompt
- [ ] Chat Model (Gemini) credential sudah di-set
- [ ] Memory (Window Buffer) menggunakan sessionId
- [ ] Minimal 3 tools sudah dikonfigurasi (FAQ, Harga, Layanan)
- [ ] Google Sheets sudah diisi data dan di-share ke service account n8n
- [ ] Knowledge Base sudah diisi dokumen perusahaan (opsional tapi recommended)
- [ ] Workflow di-activate (toggle ON)
- [ ] Test dengan mengirim request manual ke webhook

---

## 🧪 Testing

### Test Manual via curl:
```bash
curl -X POST https://n8n.klikus.xyz/webhook/caruba-agent \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Apa itu Utero?",
    "history": [],
    "sessionId": "test-123"
  }'
```

### Expected Response:
```json
{
  "output": "Utero adalah PT Utero Kreatif Indonesia, Creative Agency legendaris yang telah berdiri sejak tahun 1998. Kami dikenal sebagai Idea and Concept Factory dengan filosofi bahwa ide tanpa realisasi sama dengan sampah."
}
```

---

## ⚠️ Troubleshooting

| Problem | Solution |
|---|---|
| n8n tidak merespons | Pastikan workflow di-activate (toggle ON) |
| "N8N_WEBHOOK_URL is not configured" | Set `N8N_WEBHOOK_URL` di `.env` web app |
| AI tidak menggunakan tools | Periksa tool descriptions, pastikan cukup detail |
| Response format salah | Web app sudah handle berbagai format (output, text, message, choices) |
| Memory tidak bekerja | Pastikan sessionId dikirim dan dikonfigurasi di Memory node |
| Google Sheets error | Pastikan sheets di-share ke email service account n8n |
