import { NextRequest, NextResponse } from 'next/server';
import { getSystemPrompt, DEFAULT_MODEL, getModelById, AIProvider, AI_MODELS } from '@/constants/ai';

interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

interface ChatRequest {
    message: string;
    model?: string;
    provider?: AIProvider;
    history?: ChatMessage[];
}

// n8n Integration

const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL;
const USE_N8N = process.env.USE_N8N === 'true';

// Call n8n Webhook
async function callN8N(message: string, history: ChatMessage[], model: string): Promise<unknown> {
    if (!N8N_WEBHOOK_URL) {
        throw new Error('N8N_WEBHOOK_URL is not configured');
    }

    console.log('[n8n] Calling webhook:', N8N_WEBHOOK_URL);
    console.log('[n8n] Model:', model, '| Message:', message.substring(0, 50) + '...');

    const response = await fetch(N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            message,
            history,
            model,
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

// Fallback models to try if the primary model fails (ordered by stability)
const FALLBACK_MODELS = [
    'nvidia/nemotron-nano-9b-v2:free',
    'qwen/qwen3-4b:free',
    'openai/gpt-oss-120b:free',
    'google/gemma-3-27b-it:free',
    'google/gemma-3-12b-it:free',
    'meta-llama/llama-3.3-70b-instruct:free',
];

// Call OpenRouter API with retry logic
async function callOpenRouter(messages: ChatMessage[], model: string, retryWithFallback: boolean = true): Promise<{ data: unknown; usedModel: string }> {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
        throw new Error('OPENROUTER_API_KEY is not configured');
    }

    console.log('[OpenRouter] Calling with model:', model);

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'https://utero.id',
            'X-Title': 'CarubaAI',
        },
        body: JSON.stringify({
            model,
            messages,
            max_tokens: 500,
            temperature: 0.7,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[OpenRouter] API error for model', model, ':', errorData);

        // Check for rate limit (429) or model not found (404)
        if (retryWithFallback && (response.status === 404 || response.status === 429 || response.status === 503)) {
            console.log('[OpenRouter] Trying fallback models...');

            // Try fallback models
            for (const fallbackModel of FALLBACK_MODELS) {
                if (fallbackModel === model) continue; // Skip the model that just failed

                try {
                    console.log('[OpenRouter] Trying fallback model:', fallbackModel);
                    const result = await callOpenRouter(messages, fallbackModel, false);
                    return result;
                } catch (fallbackError) {
                    console.log('[OpenRouter] Fallback model failed:', fallbackModel);
                    continue;
                }
            }
        }

        // Extract meaningful error message
        const errorMessage = errorData?.error?.message || `API error: ${response.status}`;
        throw new Error(`OpenRouter: ${errorMessage}`);
    }

    const data = await response.json();
    return { data, usedModel: model };
}

// Call Gemini API
async function callGemini(messages: ChatMessage[], model: string) {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error('GEMINI_API_KEY is not configured');
    }

    console.log('[Gemini] Calling with model:', model);

    // Convert messages to Gemini format
    const geminiMessages = messages
        .filter(m => m.role !== 'system')
        .map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }]
        }));

    // Get system instruction
    const systemInstruction = messages.find(m => m.role === 'system')?.content || '';

    const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                contents: geminiMessages,
                systemInstruction: {
                    parts: [{ text: systemInstruction }]
                },
                generationConfig: {
                    maxOutputTokens: 500,
                    temperature: 0.7,
                },
            }),
        }
    );

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[Gemini] API error:', errorData);

        // Check for quota exceeded
        const errorMessage = errorData?.error?.message || `API error: ${response.status}`;
        if (errorMessage.includes('quota') || errorMessage.includes('RESOURCE_EXHAUSTED')) {
            throw new Error('Gemini: Quota exceeded. Please try OpenRouter models instead.');
        }

        throw new Error(`Gemini: ${errorMessage}`);
    }

    const data = await response.json();

    // Convert Gemini response to OpenAI format for consistency
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || 'Maaf, terjadi kesalahan.';

    return {
        id: `gemini-${Date.now()}`,
        choices: [{
            message: {
                role: 'assistant',
                content: content
            },
            finish_reason: 'stop'
        }],
        model: model,
        usage: {
            prompt_tokens: data.usageMetadata?.promptTokenCount || 0,
            completion_tokens: data.usageMetadata?.candidatesTokenCount || 0,
            total_tokens: data.usageMetadata?.totalTokenCount || 0,
        }
    };
}

// ========================================
// Main API Handler
// ========================================

export async function POST(request: NextRequest) {
    try {
        const body: ChatRequest = await request.json();
        const { message, model: requestedModel, provider: requestedProvider, history = [] } = body;

        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { error: 'Message is required' },
                { status: 400 }
            );
        }

        // Determine model and provider
        const selectedModel = requestedModel || DEFAULT_MODEL;
        const modelInfo = getModelById(selectedModel);
        const provider: AIProvider = requestedProvider || modelInfo?.provider || 'openrouter';

        // ========================================
        // Mode 1: n8n as the AI Brain
        // ========================================
        if (USE_N8N && N8N_WEBHOOK_URL) {
            console.log('[Chat API] Using n8n mode | Model:', selectedModel);

            try {
                const responseData = await callN8N(message, history, selectedModel);

                return NextResponse.json({
                    ...(responseData as object),
                    _usedModel: selectedModel,
                    _via: 'n8n',
                });
            } catch (n8nError) {
                console.error('[Chat API] n8n failed, falling back to direct API:', n8nError);
                // Fall through to direct API mode
            }
        }

        // ========================================
        // Mode 2: Direct API calls (fallback)
        // ========================================
        console.log('[Chat API] Using direct API mode | Model:', selectedModel, 'Provider:', provider);

        // Build messages array with system prompt and history
        const messages: ChatMessage[] = [
            { role: 'system', content: getSystemPrompt() },
            ...history.map((msg) => ({
                role: msg.role as 'user' | 'assistant',
                content: msg.content,
            })),
            { role: 'user', content: message },
        ];

        let responseData;
        let usedModel = selectedModel;

        if (provider === 'gemini') {
            // Check if Gemini API key is available
            if (!process.env.GEMINI_API_KEY) {
                console.log('[Chat API] Gemini API key not found, falling back to OpenRouter');
                if (!process.env.OPENROUTER_API_KEY) {
                    return NextResponse.json(
                        { error: 'No API keys configured. Please set GEMINI_API_KEY or OPENROUTER_API_KEY' },
                        { status: 500 }
                    );
                }
                const result = await callOpenRouter(messages, FALLBACK_MODELS[0]);
                responseData = result.data;
                usedModel = result.usedModel;
            } else {
                // Use Gemini directly, don't fallback to OpenRouter
                responseData = await callGemini(messages, selectedModel);
            }
        } else {
            // OpenRouter
            if (!process.env.OPENROUTER_API_KEY) {
                console.log('[Chat API] OpenRouter API key not found, falling back to Gemini');
                if (!process.env.GEMINI_API_KEY) {
                    return NextResponse.json(
                        { error: 'No API keys configured. Please set GEMINI_API_KEY or OPENROUTER_API_KEY' },
                        { status: 500 }
                    );
                }
                responseData = await callGemini(messages, 'gemini-2.0-flash');
                usedModel = 'gemini-2.0-flash';
            } else {
                const result = await callOpenRouter(messages, selectedModel);
                responseData = result.data;
                usedModel = result.usedModel;
            }
        }

        // Add info about which model was actually used
        const response = {
            ...(responseData as object),
            _usedModel: usedModel,
            _via: 'direct',
        };

        return NextResponse.json(response);
    } catch (error) {
        console.error('[Chat API] Error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';

        return NextResponse.json(
            {
                error: 'Failed to get AI response',
                details: errorMessage,
                suggestion: 'Try selecting a different model or check your API keys.'
            },
            { status: 500 }
        );
    }
}

// Health check
export async function GET() {
    const availableModels = AI_MODELS.map(m => ({
        id: m.id,
        name: m.name,
        provider: m.provider,
    }));

    return NextResponse.json({
        status: 'ok',
        message: 'CarubaAI Chat API is running',
        mode: USE_N8N ? 'n8n' : 'direct',
        n8nConfigured: !!N8N_WEBHOOK_URL,
        hasGeminiKey: !!process.env.GEMINI_API_KEY,
        hasOpenRouterKey: !!process.env.OPENROUTER_API_KEY,
        defaultModel: DEFAULT_MODEL,
        availableModels,
    });
}
