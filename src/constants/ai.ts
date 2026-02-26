// AI Configuration - Minimal (All AI logic is in n8n)
// This file only contains UI-related constants

// Greeting messages for the avatar
export const GREETING_MESSAGE = "Halo! Saya CarubaAI, Virtual Assistant dari PT Utero Kreatif Indonesia, Creative Agency yang telah berdiri sejak 1998. Silakan tekan tombol mikrofon dan ajukan pertanyaan seputar layanan kami!";

export const LISTENING_MESSAGE = "Saya mendengarkan...";

export const PROCESSING_MESSAGE = "Sedang memproses...";

export const ERROR_MESSAGE = "Maaf, terjadi kesalahan. Silakan coba lagi.";

// Legacy exports for backward compatibility (no longer used for AI logic)
export type AIProvider = 'n8n';

export interface AIModel {
   id: string;
   name: string;
   provider: AIProvider;
   description: string;
}

export const AI_MODEL: AIModel = {
   id: 'n8n-ai-agent',
   name: 'n8n AI Agent',
   provider: 'n8n',
   description: 'AI Agent powered by n8n workflow with smart document routing',
};

export const AI_MODELS: AIModel[] = [AI_MODEL];
export const DEFAULT_MODEL = 'n8n-ai-agent';
export const DEFAULT_PROVIDER: AIProvider = 'n8n';

export const getModelById = (modelId: string): AIModel | undefined => {
   return AI_MODELS.find(m => m.id === modelId);
};

export const getModelsByProvider = (provider: AIProvider): AIModel[] => {
   return AI_MODELS.filter(m => m.provider === provider);
};
