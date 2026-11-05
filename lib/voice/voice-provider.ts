export interface TranscriptionResult {
  text: string;
  confidence?: number;
  language?: string;
  segments?: TranscriptionSegment[];
  isFinal: boolean;
}

export interface TranscriptionSegment {
  text: string;
  startMs?: number;
  endMs?: number;
  confidence?: number;
}

export interface TranscriptionOptions {
  language?: string;
  model?: string;
  prompt?: string;
  temperature?: number;
  responseFormat?: "json" | "text" | "srt" | "vtt";
  timestampGranularities?: ("word" | "segment")[];
}

export interface TranscriptionProvider {
  name: string;
  transcribe(audioBuffer: Buffer, options?: TranscriptionOptions): Promise<TranscriptionResult>;
  transcribeStream?(audioStream: AsyncIterable<Buffer>, options?: TranscriptionOptions): AsyncIterable<TranscriptionResult>;
  supportsStreaming(): boolean;
  getSupportedLanguages(): string[];
  getMaxFileSize(): number;
  getSupportedFormats(): string[];
}

export interface SynthesisOptions {
  voice?: string;
  language?: string;
  speed?: number;
  pitch?: number;
  format?: "mp3" | "wav" | "ogg" | "flac";
  sampleRate?: number;
}

export interface SynthesisResult {
  audioBuffer: Buffer;
  format: string;
  durationMs?: number;
}

export interface SynthesisProvider {
  name: string;
  synthesize(text: string, options?: SynthesisOptions): Promise<SynthesisResult>;
  getSupportedVoices(): VoiceOption[];
  getSupportedLanguages(): string[];
  getMaxTextLength(): number;
}

export interface VoiceOption {
  id: string;
  name: string;
  language: string;
  gender?: "male" | "female" | "neutral";
  previewUrl?: string;
}

export interface VoiceProviderConfig {
  transcription?: TranscriptionProvider;
  synthesis?: SynthesisProvider;
}

export interface BrowserNativeTranscriptionResult extends TranscriptionResult {
  isFinal: boolean;
}

export interface BrowserNativeSynthesisOptions extends Omit<SynthesisOptions, "voice"> {
  voice?: SpeechSynthesisVoice;
}