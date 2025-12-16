export enum ModelType {
  GEMINI_3_PRO = 'gemini-3-pro-preview',
  GEMINI_2_5_FLASH = 'gemini-2.5-flash',
}

export type PerspectiveType = 'generalist' | 'expert' | 'skeptic';
export type DepthType = 'concise' | 'comprehensive';

export interface AnalysisConfig {
  perspective: PerspectiveType;
  depth: DepthType;
}

export interface AnalysisRequest {
  url: string;
  model: ModelType;
  config: AnalysisConfig;
}

export interface GroundingMetadata {
  web?: {
    uri: string;
    title: string;
  };
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: number;
}

export interface AnalysisResult {
  markdown: string;
  groundingLinks: GroundingMetadata[];
  isLoading: boolean;
  error?: string;
  executionTime?: number;
}

export interface AppState {
  url: string;
  selectedModel: ModelType;
  config: AnalysisConfig;
  result: AnalysisResult | null;
  chatHistory: ChatMessage[];
}