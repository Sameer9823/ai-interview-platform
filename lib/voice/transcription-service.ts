import "server-only";
import {
  TranscriptionProvider,
  TranscriptionResult,
  TranscriptionOptions,
  TranscriptionSegment,
} from "./voice-provider";
import { AiServiceError } from "@/lib/ai/errors";

export class OpenAIWhisperTranscriptionProvider {
  name = "openai-whisper";
  private apiKey: string;
  private baseUrl: string = "https://api.openai.com/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async transcribe(audioBuffer: Buffer, options?: {
    language?: string;
    model?: string;
    prompt?: string;
    temperature?: number;
    responseFormat?: "json" | "text" | "srt" | "vtt";
    timestampGranularities?: ("word" | "segment")[];
  }): Promise<{
    text: string;
    confidence?: number;
    language?: string;
    segments?: { text: string; startMs?: number; endMs?: number; confidence?: number }[];
    isFinal: boolean;
  }> {
    const formData = new FormData();
    const blob = new Blob([new Uint8Array(audioBuffer)]);
    formData.append("file", blob, "audio.webm");
    formData.append("model", options?.model || "whisper-1");
    if (options?.language) formData.append("language", options.language);
    if (options?.prompt) formData.append("prompt", options.prompt);
    if (options?.temperature !== undefined) formData.append("temperature", String(options.temperature));
    if (options?.responseFormat) formData.append("response_format", options.responseFormat);
    if (options?.timestampGranularities) {
      for (const granularity of options.timestampGranularities) {
        formData.append("timestamp_granularities[]", granularity);
      }
    }

    const response = await fetch(`${this.baseUrl}/audio/transcriptions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new AiServiceError("PROVIDER_ERROR", `OpenAI Whisper error: ${response.status} ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();

    const segments: TranscriptionSegment[] = data.segments?.map((s: any) => ({
      text: s.text,
      startMs: Math.round(s.start * 1000),
      endMs: Math.round(s.end * 1000),
      confidence: s.avg_logprob ? Math.exp(s.avg_logprob) : undefined,
    })) || [];

    return {
      text: data.text,
      confidence: segments.length > 0
        ? segments.reduce((sum, s) => sum + (s.confidence || 0), 0) / segments.length
        : undefined,
      language: data.language,
      segments,
      isFinal: true,
    };
  }

  supportsStreaming(): boolean {
    return false;
  }

  getSupportedLanguages(): string[] {
    return [
      "en", "es", "fr", "de", "it", "pt", "nl", "pl", "ru", "ja", "ko", "zh",
      "ar", "hi", "tr", "sv", "da", "no", "fi", "cs", "hu", "ro", "sk", "uk"
    ];
  }

  getMaxFileSize(): number {
    return 25 * 1024 * 1024; // 25MB
  }

  getSupportedFormats(): string[] {
    return ["mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm", "flac", "ogg"];
  }
}

export class DeepgramTranscriptionProvider {
  name = "deepgram";
  private apiKey: string;
  private baseUrl: string = "https://api.deepgram.com/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async transcribe(audioBuffer: Buffer, options?: {
    language?: string;
    model?: string;
    prompt?: string;
    punctuate?: boolean;
    diarize?: boolean;
    smartFormat?: boolean;
  }): Promise<{
    text: string;
    confidence?: number;
    language?: string;
    segments?: TranscriptionSegment[];
    isFinal: boolean;
  }> {
    const model = options?.model || "nova-2";
    const url = `${this.baseUrl}/listen?model=${model}&punctuate=${options?.punctuate !== false}&diarize=${options?.diarize || false}&smart_format=${options?.smartFormat !== false}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Token ${this.apiKey}`,
        "Content-Type": "audio/webm",
      },
      body: audioBuffer as unknown as RequestInit['body'],
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new AiServiceError("PROVIDER_ERROR", `Deepgram error: ${response.status} ${error.message || response.statusText}`);
    }

    const data = await response.json();
    const channel = data.results?.channels?.[0];
    const alternatives = channel?.alternatives?.[0];

    const segments: TranscriptionSegment[] = alternatives?.words?.map((w: any) => ({
      text: w.word,
      startMs: Math.round(w.start * 1000),
      endMs: Math.round(w.end * 1000),
      confidence: w.confidence,
    })) || [];

    return {
      text: alternatives?.transcript || "",
      confidence: alternatives?.confidence,
      language: channel?.detected_language,
      segments,
      isFinal: true,
    };
  }

  supportsStreaming(): boolean {
    return true;
  }

  getSupportedLanguages(): string[] {
    return ["en", "es", "fr", "de", "it", "pt", "nl", "pl", "ru", "ja", "ko", "zh", "ar", "hi", "tr"];
  }

  getMaxFileSize(): number {
    return 200 * 1024 * 1024; // 200MB
  }

  getSupportedFormats(): string[] {
    return ["mp3", "wav", "flac", "ogg", "webm", "m4a", "mp4"];
  }
}

export class AssemblyAITranscriptionProvider {
  name = "assemblyai";
  private apiKey: string;
  private baseUrl: string = "https://api.assemblyai.com/v2";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async transcribe(audioBuffer: Buffer, options?: {
    language?: string;
    punctuate?: boolean;
    formatText?: boolean;
    speakerLabels?: boolean;
  }): Promise<{
    text: string;
    confidence?: number;
    language?: string;
    segments?: TranscriptionSegment[];
    isFinal: boolean;
  }> {
    // First upload the file
    const uploadResponse = await fetch(`${this.baseUrl}/upload`, {
      method: "POST",
      headers: {
        Authorization: this.apiKey,
        "Content-Type": "application/octet-stream",
      },
      body: audioBuffer as unknown as RequestInit['body'],
    });

    if (!uploadResponse.ok) {
      throw new AiServiceError("PROVIDER_ERROR", "Failed to upload audio to AssemblyAI");
    }

    const { upload_url } = await uploadResponse.json();

    // Request transcription
    const transcriptResponse = await fetch(`${this.baseUrl}/transcript`, {
      method: "POST",
      headers: {
        Authorization: this.apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        audio_url: upload_url,
        language_code: options?.language || "en_us",
        punctuate: options?.punctuate !== false,
        format_text: options?.formatText !== false,
        speaker_labels: options?.speakerLabels || false,
      }),
    });

    if (!transcriptResponse.ok) {
      throw new AiServiceError("PROVIDER_ERROR", "Failed to start transcription");
    }

    const transcript = await transcriptResponse.json();

    // Poll for completion
    let completed = false;
    let attempts = 0;
    while (!completed && attempts < 60) {
      await new Promise(resolve => setTimeout(resolve, 2000));
      const statusResponse = await fetch(`${this.baseUrl}/transcript/${transcript.id}`, {
        headers: { Authorization: this.apiKey },
      });
      const statusData = await statusResponse.json();
      if (statusData.status === "completed") {
        completed = true;
        const segments: TranscriptionSegment[] = statusData.words?.map((w: any) => ({
          text: w.text,
          startMs: w.start,
          endMs: w.end,
          confidence: w.confidence,
        })) || [];

        return {
          text: statusData.text,
          confidence: statusData.confidence,
          language: statusData.language_code,
          segments,
          isFinal: true,
        };
      } else if (statusData.status === "error") {
        throw new AiServiceError("PROVIDER_ERROR", `AssemblyAI transcription failed: ${statusData.error}`);
      }
      attempts++;
    }

    throw new AiServiceError("TIMEOUT", "AssemblyAI transcription timed out");
  }

  supportsStreaming(): boolean {
    return false;
  }

  getSupportedLanguages(): string[] {
    return ["en", "es", "fr", "de", "it", "pt", "ja", "ko", "zh", "hi", "ar", "ru", "pl", "nl", "tr", "sv", "da", "no", "fi", "cs", "hu", "ro", "sk", "uk"];
  }

  getMaxFileSize(): number {
    return 5 * 1024 * 1024 * 1024; // 5GB
  }

  getSupportedFormats(): string[] {
    return ["mp3", "wav", "flac", "ogg", "webm", "m4a", "mp4", "mpeg", "mpga", "wma", "aac", "aiff", "aifc"];
  }
}

export class BrowserNativeTranscriptionProvider {
  name = "browser-native";

  async transcribe(audioBlob: Blob | Buffer, options?: { language?: string }): Promise<{
    text: string;
    isFinal: boolean;
  }> {
    if (typeof window === "undefined" || !("SpeechRecognition" in window) && !("webkitSpeechRecognition" in window)) {
      throw new AiServiceError("NOT_CONFIGURED", "Browser native speech recognition not available");
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    recognition.lang = options?.language || "en-US";
    recognition.continuous = true;
    recognition.interimResults = true;

    return new Promise((resolve, reject) => {
      let finalTranscript = "";

      recognition.onresult = (event: any) => {
        let interimTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }
      };

      recognition.onerror = (event: any) => {
        reject(new Error(`Speech recognition error: ${event.error}`));
      };

      recognition.onend = () => {
        resolve({ text: finalTranscript, isFinal: true });
      };

      // Note: This is a simplified version. Real implementation would need
      // to handle audio input from MediaRecorder or similar.
      // For now, this is a placeholder for the browser-native API structure.
      reject(new AiServiceError("NOT_CONFIGURED", "Browser native transcription requires MediaRecorder integration"));
    });
  }

  supportsStreaming(): boolean {
    return true;
  }

  getSupportedLanguages(): string[] {
    if (typeof navigator !== "undefined") {
      return [...(navigator.languages || [navigator.language])];
    }
    return ["en-US"];
  }

  getMaxFileSize(): number {
    return 0; // Not applicable for streaming
  }

  getSupportedFormats(): string[] {
    return ["audio/webm", "audio/ogg", "audio/wav"];
  }
}

export function createTranscriptionProvider(type: string, apiKey?: string) {
  switch (type.toLowerCase()) {
    case "openai":
    case "whisper":
      if (!apiKey) throw new Error("OpenAI API key required for Whisper provider");
      return new OpenAIWhisperTranscriptionProvider(apiKey);
    case "deepgram":
      if (!apiKey) throw new Error("Deepgram API key required");
      return new DeepgramTranscriptionProvider(apiKey);
    case "assemblyai":
      if (!apiKey) throw new Error("AssemblyAI API key required");
      return new AssemblyAITranscriptionProvider(apiKey);
    case "browser":
    case "browser-native":
      return new BrowserNativeTranscriptionProvider();
    default:
      throw new Error(`Unknown transcription provider: ${type}`);
  }
}