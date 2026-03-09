import { NextRequest, NextResponse } from 'next/server';

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface ChatRequest {
    message: string;
    history?: ChatMessage[];
    sessionId?: string;
}

// n8n Configuration 
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;


// n8n Webhook Call (Full AI Logic in n8n)
async function callN8N(message: string, history: ChatMessage[], sessionId: string): Promise<unknown> {
    if (!N8N_WEBHOOK_URL) {
        throw new Error('N8N_WEBHOOK_URL is not configured. Please set it in .env');
    }

    console.log('[n8n] Calling webhook:', N8N_WEBHOOK_URL);
    console.log('[n8n] Session:', sessionId, '| Message:', message.substring(0, 80));

    const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message,
            history: history.slice(-10), // Send last 10 messages for context
            sessionId,
        }),
    });

    if (!response.ok) {
        const errorText = await response.text().catch(() => 'Unknown error');
        console.error('[n8n] Webhook error:', response.status, errorText);
        throw new Error(`n8n webhook error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[n8n] Response received successfully');
    return data;
}


// Format n8n Response to Standard ChatResponse

function formatN8NResponse(data: unknown): object {
    // n8n may return different formats depending on configuration
    // We normalize it to our standard ChatResponse format

    // Case 1: n8n returns already formatted ChatResponse
    if (data && typeof data === 'object' && 'choices' in data) {
        return data as object;
    }

    // Case 2: n8n returns { output: "text" } from AI Agent
    if (data && typeof data === 'object' && 'output' in data) {
        const output = (data as { output: string }).output;
        return {
            id: `n8n-${Date.now()}`,
            choices: [{
                message: {
                    role: 'assistant',
                    content: output,
                },
                finish_reason: 'stop',
            }],
            model: 'n8n-ai-agent',
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        };
    }

    // Case 3: n8n returns { text: "text" }
    if (data && typeof data === 'object' && 'text' in data) {
        const text = (data as { text: string }).text;
        return {
            id: `n8n-${Date.now()}`,
            choices: [{
                message: {
                    role: 'assistant',
                    content: text,
                },
                finish_reason: 'stop',
            }],
            model: 'n8n-ai-agent',
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        };
    }

    // Case 4: n8n returns { message: "text" }
    if (data && typeof data === 'object' && 'message' in data) {
        const message = (data as { message: string }).message;
        return {
            id: `n8n-${Date.now()}`,
            choices: [{
                message: {
                    role: 'assistant',
                    content: typeof message === 'string' ? message : JSON.stringify(message),
                },
                finish_reason: 'stop',
            }],
            model: 'n8n-ai-agent',
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        };
    }

    // Case 5: n8n returns plain string
    if (typeof data === 'string') {
        return {
            id: `n8n-${Date.now()}`,
            choices: [{
                message: {
                    role: 'assistant',
                    content: data,
                },
                finish_reason: 'stop',
            }],
            model: 'n8n-ai-agent',
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        };
    }

    // Case 6: n8n returns array (sometimes AI Agent returns array)
    if (Array.isArray(data) && data.length > 0) {
        const firstItem = data[0];
        const content = firstItem?.output || firstItem?.text || firstItem?.message || JSON.stringify(firstItem);
        return {
            id: `n8n-${Date.now()}`,
            choices: [{
                message: {
                    role: 'assistant',
                    content: typeof content === 'string' ? content : JSON.stringify(content),
                },
                finish_reason: 'stop',
            }],
            model: 'n8n-ai-agent',
            usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        };
    }

    // Fallback: stringify whatever we got
    console.warn('[n8n] Unexpected response format:', JSON.stringify(data).substring(0, 200));
    return {
        id: `n8n-${Date.now()}`,
        choices: [{
            message: {
                role: 'assistant',
                content: 'Maaf, terjadi kesalahan dalam memproses respons. Silakan coba lagi.',
            },
            finish_reason: 'stop',
        }],
        model: 'n8n-ai-agent',
        usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
    };
}


// Main API Handler - Pure n8n Proxy

export async function POST(request: NextRequest) {
    // Parse body BEFORE try/catch so it's available in the catch block
    let body: ChatRequest;
    try {
        body = await request.json();
    } catch {
        return NextResponse.json(
            { error: 'Invalid request body' },
            { status: 400 }
        );
    }

    const { message, history = [], sessionId } = body;

    if (!message || typeof message !== 'string') {
        return NextResponse.json(
            { error: 'Message is required' },
            { status: 400 }
        );
    }

    // Generate sessionId if not provided (for memory in n8n)
    const session = sessionId || `session-${Date.now()}`;

    try {
        console.log('[Chat API] Sending to n8n | Session:', session);

        // All AI logic is handled by n8n
        const responseData = await callN8N(message, history, session);

        // Format the response to standard ChatResponse
        const formattedResponse = formatN8NResponse(responseData);

        return NextResponse.json({
            ...formattedResponse,
            _via: 'n8n',
        });

    } catch (error) {
        console.error('[Chat API] Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        // // ============================================================
        // // MOCK FALLBACK: Return dummy response when n8n is unreachable
        // // Remove or comment this block when n8n is back online
        // // ============================================================
        // console.log('[Chat API] n8n unreachable - returning mock response for:', message);

        // let mockReply = `Terima kasih atas pertanyaan Anda: "${message}". Saat ini server AI sedang dalam maintenance. Silakan coba lagi nanti atau hubungi kami di 0341-123456.`;

        // if (/harga|price|biaya|tarif/i.test(message)) {
        //     mockReply = `Berikut **estimasi harga** layanan kami:\n\n- **Desain Logo**: Mulai dari Rp2.500.000\n- **Branding Package**: Mulai dari Rp5.000.000\n- **Social Media Management**: Mulai dari Rp3.000.000 per bulan\n- **Website Development**: Mulai dari Rp8.000.000\n\nUntuk penawaran detail, silakan hubungi kami di **0341-123456** atau email ke **info@utero.id**`;
        // } else if (/layanan|service|jasa/i.test(message)) {
        //     mockReply = `PT Utero Kreatif Indonesia menyediakan berbagai **layanan kreatif**, antara lain:\n\n- Desain Grafis & Branding\n- Digital Marketing & Social Media\n- Website & App Development\n- Video Production\n- Photography\n\nKami telah berpengalaman sejak **1998** melayani berbagai klien di seluruh Indonesia.`;
        // } else if (/jam|buka|operasional|office/i.test(message)) {
        //     mockReply = `Jam operasional kantor kami:\n\nSenin-Jumat pukul 09:00-17:00 WIB\nSabtu pukul 09:00-14:00 WIB\nMinggu & Hari Libur: Tutup\n\nAlamat: Jl. Soekarno Hatta No. 9, Malang, Jawa Timur`;
        // }

        // return NextResponse.json({
        //     id: `mock-${Date.now()}`,
        //     choices: [{
        //         message: {
        //             role: 'assistant',
        //             content: mockReply,
        //         },
        //         finish_reason: 'stop',
        //     }],
        //     model: 'mock-fallback',
        //     usage: { prompt_tokens: 0, completion_tokens: 0, total_tokens: 0 },
        //     _via: 'mock-fallback',
        //     _error: errorMessage,
        // });
        // // ============================================================
        // // END MOCK FALLBACK
        // // When n8n is back, uncomment below and remove mock above:
        // // return NextResponse.json(
        // //     {
        // //         error: 'Failed to get AI response',
        // //         details: errorMessage,
        // //         suggestion: 'Please check N8N_WEBHOOK_URL configuration.',
        // //     },
        // //     { status: 500 }
        // // );
        // // ============================================================
    }
}

// Health check
export async function GET() {
    return NextResponse.json({
        status: 'ok',
        message: 'CarubaAI Chat API is running',
        mode: 'n8n-only',
        n8nConfigured: !!N8N_WEBHOOK_URL,
        architecture: 'Web (STT/TTS) → n8n (AI Brain) → Web (TTS)',
    });
}
