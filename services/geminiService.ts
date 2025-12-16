import { GoogleGenAI, Tool, Chat } from "@google/genai";
import { ModelType, GroundingMetadata, AnalysisConfig } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Constructs a dynamic system instruction based on user configuration.
 */
const getSystemInstruction = (config: AnalysisConfig): string => {
  const { perspective, depth } = config;

  let persona = "";
  switch (perspective) {
    case 'expert':
      persona = "Anda adalah Ahli Riset Senior. Gunakan terminologi industri yang presisi, fokus pada metodologi, data teknis, dan nuansa ilmiah. Jangan menyederhanakan hal-hal kompleks.";
      break;
    case 'skeptic':
      persona = "Anda adalah Kritikus Analitis. Cari celah dalam argumen, periksa bias, pertanyakan validitas sumber, dan berikan pandangan yang menantang namun objektif.";
      break;
    case 'generalist':
    default:
      persona = "Anda adalah Komunikator Sains Populer. Jelaskan konsep sulit dengan analogi yang mudah dipahami, fokus pada 'big picture' dan dampak nyata.";
      break;
  }

  let lengthInstruction = depth === 'concise' 
    ? "Berikan ringkasan yang padat, langsung pada intinya (TL;DR), dan hilangkan detail berlebihan." 
    : "Berikan analisis yang sangat komprehensif, mencakup setiap aspek penting, latar belakang, dan detail pendukung.";

  return `
PERAN: ${persona}
NAMA: Synapse

TUGAS:
1. Analisis URL yang diberikan menggunakan Google Search grounding.
2. ${lengthInstruction}
3. Pertahankan struktur: Judul, Ringkasan Eksekutif, Poin Kunci, Analisis Mendalam (jika mode Comprehensive), dan Glosarium Teknis.

PENTING:
- Gunakan Bahasa Indonesia yang natural dan profesional.
- Selalu sertakan kutipan/sumber.
`;
};

// Helper to format error messages
const formatErrorMessage = (err: any): string => {
  if (!navigator.onLine) {
    return "Koneksi internet terputus. Periksa jaringan Anda dan coba lagi.";
  }

  const msg = err.message || JSON.stringify(err);

  if (msg.includes("429")) return "Terlalu banyak permintaan (Quota Exceeded). Harap tunggu beberapa saat sebelum mencoba lagi.";
  if (msg.includes("503") || msg.includes("overloaded")) return "Server Gemini sedang sibuk. Silakan coba lagi dalam beberapa saat.";
  if (msg.includes("safety") || msg.includes("blocked")) return "Konten diblokir oleh filter keamanan AI. URL mungkin mengandung materi sensitif.";
  if (msg.includes("400")) return "Permintaan tidak valid. Periksa URL atau konfigurasi input.";
  
  return `Terjadi kesalahan sistem: ${msg.substring(0, 100)}...`;
};

// We return the chat session so the UI can hold onto it for follow-up questions
export const startAnalysisSession = async (
  url: string,
  modelId: ModelType,
  config: AnalysisConfig,
  onChunk: (text: string) => void,
  onComplete: (groundingChunks: GroundingMetadata[]) => void,
  onError: (error: string) => void
): Promise<Chat | null> => {
  try {
    const systemInstruction = getSystemInstruction(config);
    const tools: Tool[] = [{ googleSearch: {} }];

    // Initialize Chat Session instead of single generateContent
    const chat = ai.chats.create({
      model: modelId,
      config: {
        systemInstruction,
        tools,
        // Only use thinking for the Pro model to manage token budget/latency trade-off
        thinkingConfig: modelId === ModelType.GEMINI_3_PRO ? { thinkingBudget: 2048 } : undefined,
      }
    });

    const prompt = `Analisis URL ini: ${url}`;

    const responseStream = await chat.sendMessageStream({ message: prompt });

    let fullText = "";
    let capturedGrounding: GroundingMetadata[] = [];

    for await (const chunk of responseStream) {
      const chunkText = chunk.text;
      if (chunkText) {
        fullText += chunkText;
        onChunk(fullText);
      }

      const grounding = chunk.candidates?.[0]?.groundingMetadata?.groundingChunks;
      if (grounding) {
        const webChunks = grounding
            .filter((g: any) => g.web)
            .map((g: any) => ({
                web: {
                    uri: g.web.uri,
                    title: g.web.title
                }
            }));
        if (webChunks.length > 0) {
            capturedGrounding = [...capturedGrounding, ...webChunks];
        }
      }
    }

    onComplete(capturedGrounding);
    return chat; // Return session for future use

  } catch (err: any) {
    console.error("Gemini API Error:", err);
    onError(formatErrorMessage(err));
    return null;
  }
};

export const sendFollowUpMessage = async (
  chatSession: Chat,
  message: string,
  onChunk: (text: string) => void,
  onComplete: () => void,
  onError: (error: string) => void
) => {
  try {
    const responseStream = await chatSession.sendMessageStream({ message: message });
    
    for await (const chunk of responseStream) {
      if (chunk.text) {
        onChunk(chunk.text);
      }
    }
    onComplete();
  } catch (err: any) {
    console.error("Follow-up Error:", err);
    onError(formatErrorMessage(err));
  }
};