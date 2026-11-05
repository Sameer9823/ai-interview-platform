import "server-only";
import { AiServiceError } from "@/lib/ai/errors";

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

export interface VoiceOption {
  id: string;
  name: string;
  language: string;
  gender?: "male" | "female" | "neutral";
  previewUrl?: string;
}

export class OpenAITTSProvider {
  name = "openai-tts";
  private apiKey: string;
  private baseUrl: string = "https://api.openai.com/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async synthesize(text: string, options?: SynthesisOptions): Promise<SynthesisResult> {
    const response = await fetch(`${this.baseUrl}/audio/speech`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1-hd",
        input: text,
        voice: options?.voice || "alloy",
        response_format: options?.format || "mp3",
        speed: options?.speed || 1.0,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new AiServiceError("PROVIDER_ERROR", `OpenAI TTS error: ${response.status} ${error.error?.message || response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      audioBuffer: Buffer.from(arrayBuffer),
      format: options?.format || "mp3",
    };
  }

  getSupportedVoices(): { id: string; name: string; language: string; gender?: "male" | "female" | "neutral" }[] {
    return [
      { id: "alloy", name: "Alloy", language: "en", gender: "neutral" },
      { id: "echo", name: "Echo", language: "en", gender: "male" },
      { id: "fable", name: "Fable", language: "en", gender: "neutral" },
      { id: "onyx", name: "Onyx", language: "en", gender: "male" },
      { id: "nova", name: "Nova", language: "en", gender: "female" },
      { id: "shimmer", name: "Shimmer", language: "en", gender: "female" },
    ];
  }

  getSupportedLanguages(): string[] {
    return ["en", "es", "fr", "de", "it", "pt", "ja", "ko", "zh", "ar", "hi", "ru", "pl", "nl", "tr"];
  }

  getMaxTextLength(): number {
    return 4096;
  }
}

export class ElevenLabsTTSProvider {
  name = "elevenlabs";
  private apiKey: string;
  private baseUrl: string = "https://api.elevenlabs.io/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async synthesize(text: string, options?: {
    voice?: string;
    model?: string;
    stability?: number;
    similarityBoost?: number;
    style?: number;
    useSpeakerBoost?: boolean;
  }): Promise<{ audioBuffer: Buffer; format: string; durationMs?: number }> {
    const voiceId = options?.voice || "21m00Tcm4TlvDq8ikWAM"; // Default: Rachel

    const response = await fetch(`${this.baseUrl}/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": this.apiKey,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: options?.model || "eleven_monolingual_v1",
        voice_settings: {
          stability: options?.stability ?? 0.5,
          similarity_boost: options?.similarityBoost ?? 0.75,
          style: options?.style ?? 0,
          use_speaker_boost: options?.useSpeakerBoost ?? true,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new AiServiceError("PROVIDER_ERROR", `ElevenLabs TTS error: ${response.status} ${error.detail?.message || response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      audioBuffer: Buffer.from(arrayBuffer),
      format: "mp3",
    };
  }

  async getVoices(): Promise<Array<{ voice_id: string; name: string; labels: Record<string, string> }>> {
    const response = await fetch(`${this.baseUrl}/voices`, {
      headers: { "xi-api-key": this.apiKey },
    });
    if (!response.ok) return [];
    const data = await response.json();
    return data.voices || [];
  }

  getSupportedVoices(): { id: string; name: string; language: string; gender?: "male" | "female" | "neutral" }[] {
    // This would typically fetch from the API
    return [
      { id: "21m00Tcm4TlvDq8ikWAM", name: "Rachel", language: "en", gender: "female" },
      { id: "AZnzlk1XvdvUeBnXmlld", name: "Domi", language: "en", gender: "female" },
      { id: "EXAVITQu4vr4xnSDxMaL", name: "Bella", language: "en", gender: "female" },
      { id: "ErXwobaYiN019PkySvjV", name: "Antoni", language: "en", gender: "male" },
      { id: "MF3mGyEYCl7XYWbV9V6O", name: "Elliot", language: "en", gender: "male" },
      { id: "TxGEqnHWrfWFTfGW9XjX", name: "Josh", language: "en", gender: "male" },
      { id: "VR6AewLTigWG4xSOukaG", name: "Arnold", language: "en", gender: "male" },
      { id: "pNInz6obpgDQGcFmaJgB", name: "Adam", language: "en", gender: "male" },
      { id: "yoZ06aMxZJJ28mfd3POQ", name: "Sam", language: "en", gender: "neutral" },
    ];
  }

  getSupportedLanguages(): string[] {
    return ["en", "de", "pl", "es", "fr", "it", "pt", "hi", "ru", "ja", "ko", "zh", "ar", "nl", "tr", "sv", "da", "fi", "no", "cs", "hu", "ro", "sk", "uk", "bg", "hr", "lt", "lv", "et", "sl", "mt", "ga", "cy"];
  }

  getMaxTextLength(): number {
    return 5000;
  }
}

export class BrowserNativeSynthesisProvider {
  name = "browser-native";

  async synthesize(text: string, options?: { voice?: SpeechSynthesisVoice; lang?: string; rate?: number; pitch?: number; volume?: number }): Promise<{ audioBuffer: Buffer; format: string; durationMs?: number }> {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      throw new Error("Browser native speech synthesis not available");
    }

    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = options?.lang || "en-US";
      utterance.rate = options?.rate || 1.0;
      utterance.pitch = options?.pitch || 1.0;
      utterance.volume = options?.volume || 1.0;
      utterance.voice = options?.voice || null;

      // Note: Browser SpeechSynthesis doesn't provide audio buffer directly
      // This is a placeholder for the interface - actual implementation
      // would need to use Web Audio API to capture the audio output
      // For now, we'll reject with a clear message
      reject(new Error("Browser native TTS cannot produce audio buffer directly. Use Web Audio API or a server-side provider."));
    });
  }

  getSupportedVoices(): Array<{ id: string; name: string; language: string; gender?: string }> {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return [];
    }
    return speechSynthesis.getVoices().map(v => ({
      id: v.name,
      name: v.name,
      language: v.lang,
      gender: "neutral",
    }));
  }

  getSupportedLanguages(): string[] {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
      return [];
    }
    return [...new Set(speechSynthesis.getVoices().map(v => v.lang))];
  }

  getMaxTextLength(): number {
    return 10000;
  }
}

export class GoogleCloudTTSProvider {
  name = "google-cloud-tts";
  private apiKey: string;
  private baseUrl: string = "https://texttospeech.googleapis.com/v1";

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async synthesize(text: string, options?: {
    voice?: { languageCode: string; name: string; ssmlGender?: "MALE" | "FEMALE" | "NEUTRAL" };
    audioEncoding?: "MP3" | "LINEAR16" | "OGG_OPUS";
    speakingRate?: number;
    pitch?: number;
    volumeGainDb?: number;
  }): Promise<{ audioBuffer: Buffer; format: string; durationMs?: number }> {
    const response = await fetch(`${this.baseUrl}/text:synthesize?key=${this.apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: { text },
        voice: options?.voice || { languageCode: "en-US", ssmlGender: "NEUTRAL" },
        audioConfig: {
          audioEncoding: options?.audioEncoding || "MP3",
          speakingRate: options?.speakingRate ?? 1.0,
          pitch: options?.pitch ?? 0,
          volumeGainDb: options?.volumeGainDb ?? 0,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(`Google Cloud TTS error: ${response.status} ${error.error?.message || response.statusText}`);
    }

    const data = await response.json();
    const audioBuffer = Buffer.from(data.audioContent, "base64");

    return {
      audioBuffer,
      format: options?.audioEncoding === "OGG_OPUS" ? "ogg" : options?.audioEncoding === "LINEAR16" ? "wav" : "mp3",
    };
  }

  getSupportedVoices(): { id: string; name: string; language: string; gender?: string }[] {
    // Would typically fetch from API
    return [
      { id: "en-US-Standard-A", name: "Standard A", language: "en-US", gender: "FEMALE" },
      { id: "en-US-Standard-B", name: "Standard B", language: "en-US", gender: "MALE" },
      { id: "en-US-Standard-C", name: "Standard C", language: "en-US", gender: "FEMALE" },
      { id: "en-US-Standard-D", name: "Standard D", language: "en-US", gender: "MALE" },
      { id: "en-US-Wavenet-A", name: "Wavenet A", language: "en-US", gender: "FEMALE" },
      { id: "en-US-Wavenet-B", name: "Wavenet B", language: "en-US", gender: "MALE" },
      { id: "en-US-Wavenet-C", name: "Wavenet C", language: "en-US", gender: "FEMALE" },
      { id: "en-US-Wavenet-D", name: "Wavenet D", language: "en-US", gender: "MALE" },
      { id: "en-US-Neural2-A", name: "Neural2 A", language: "en-US", gender: "FEMALE" },
      { id: "en-US-Neural2-B", name: "Neural2 B", language: "en-US", gender: "MALE" },
      { id: "en-US-Neural2-C", name: "Neural2 C", language: "en-US", gender: "FEMALE" },
      { id: "en-US-Neural2-D", name: "Neural2 D", language: "en-US", gender: "MALE" },
      { id: "en-US-Studio-M", name: "Studio M", language: "en-US", gender: "MALE" },
      { id: "en-US-Studio-O", name: "Studio O", language: "en-US", gender: "FEMALE" },
    ];
  }

  getSupportedLanguages(): string[] {
    return [
      "af", "sq", "am", "ar", "hy", "az", "eu", "be", "bn", "bs", "bg", "ca", "ceb", "ny",
      "zh", "zh-CN", "zh-TW", "co", "hr", "cs", "da", "nl", "en", "eo", "et", "tl", "fi",
      "fr", "fy", "gl", "ka", "de", "el", "gu", "ht", "ha", "haw", "iw", "hi", "hmn", "hu",
      "is", "ig", "id", "ga", "it", "ja", "jw", "kn", "kk", "km", "rw", "ko", "ku", "ky",
      "lo", "la", "lv", "lt", "lb", "mk", "mg", "ms", "ml", "mt", "mi", "mr", "mn", "my",
      "ne", "no", "or", "ps", "fa", "pl", "pt", "pa", "ro", "ru", "sm", "gd", "sr", "st",
      "sn", "sd", "si", "sk", "sl", "so", "es", "su", "sw", "sv", "tg", "ta", "te", "th",
      "tr", "uk", "ur", "uz", "vi", "cy", "xh", "yi", "yo", "zu"
    ];
  }

  getMaxTextLength(): number {
    return 5000;
  }
}

export class AzureTTSProvider {
  name = "azure-tts";
  private apiKey: string;
  private region: string;
  private baseUrl: string;

  constructor(apiKey: string, region: string) {
    this.apiKey = apiKey;
    this.region = region;
    this.baseUrl = `https://${region}.tts.speech.microsoft.com/cognitiveservices/v1`;
  }

  async synthesize(text: string, options?: {
    voice?: string;
    format?: "audio-16khz-32kbitrate-mono-mp3" | "audio-16khz-64kbitrate-mono-mp3" | "riff-16khz-16bit-mono-pcm";
    rate?: string;
    pitch?: string;
    style?: string;
    styleDegree?: number;
  }): Promise<{ audioBuffer: Buffer; format: string; durationMs?: number }> {
    const token = await this.getAccessToken();

    const ssml = `
      <speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-US">
        <voice name="${options?.voice || "en-US-JennyNeural"}">
          <prosody rate="${options?.rate || "0%"}" pitch="${options?.pitch || "0%"}">
            ${text}
          </prosody>
        </voice>
      </speak>
    `;

    const response = await fetch(this.baseUrl, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/ssml+xml",
        "X-Microsoft-OutputFormat": options?.format || "audio-16khz-32kbitrate-mono-mp3",
      },
      body: ssml,
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Azure TTS error: ${response.status} ${error}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    return {
      audioBuffer: Buffer.from(arrayBuffer),
      format: "mp3",
    };
  }

  private async getAccessToken(): Promise<string> {
    const response = await fetch(`https://${this.region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`, {
      method: "POST",
      headers: { "Ocp-Apim-Subscription-Key": this.apiKey },
    });
    if (!response.ok) throw new Error("Failed to get Azure access token");
    return response.text();
  }

  getSupportedVoices(): { id: string; name: string; language: string; gender?: string }[] {
    return [
      { id: "en-US-JennyNeural", name: "Jenny", language: "en-US", gender: "Female" },
      { id: "en-US-GuyNeural", name: "Guy", language: "en-US", gender: "Male" },
      { id: "en-US-AriaNeural", name: "Aria", language: "en-US", gender: "Female" },
      { id: "en-US-DavisNeural", name: "Davis", language: "en-US", gender: "Male" },
      { id: "en-US-JaneNeural", name: "Jane", language: "en-US", gender: "Female" },
      { id: "en-US-JasonNeural", name: "Jason", language: "en-US", gender: "Male" },
      { id: "en-US-NancyNeural", name: "Nancy", language: "en-US", gender: "Female" },
      { id: "en-US-TonyNeural", name: "Tony", language: "en-US", gender: "Male" },
    ];
  }

  getSupportedLanguages(): string[] {
    return [
      "ar-EG", "ar-SA", "bg-BG", "ca-ES", "cs-CZ", "da-DK", "de-AT", "de-DE", "el-GR",
      "en-AU", "en-CA", "en-GB", "en-HK", "en-IE", "en-IN", "en-KE", "en-NZ", "en-PH", "en-SG", "en-US", "en-ZA",
      "es-ES", "es-MX", "fi-FI", "fr-CA", "fr-FR", "he-IL", "hi-IN", "hr-HR", "hu-HU", "id-ID",
      "it-IT", "ja-JP", "ko-KR", "lt-LT", "lv-LV", "ms-MY", "mt-MT", "nb-NO", "nl-BE", "nl-NL",
      "pl-PL", "pt-BR", "pt-PT", "ro-RO", "ru-RU", "sk-SK", "sl-SI", "sv-SE", "ta-IN", "te-IN",
      "th-TH", "tr-TR", "uk-UA", "vi-VN", "zh-CN", "zh-HK", "zh-TW"
    ];
  }

  getMaxTextLength(): number {
    return 10000;
  }
}

export function createSynthesisProvider(type: string, apiKey?: string, region?: string) {
  switch (type.toLowerCase()) {
    case "openai":
      if (!apiKey) throw new Error("OpenAI API key required for TTS provider");
      return new OpenAITTSProvider(apiKey);
    case "elevenlabs":
      if (!apiKey) throw new Error("ElevenLabs API key required");
      return new ElevenLabsTTSProvider(apiKey);
    case "google":
    case "google-cloud":
      if (!apiKey) throw new Error("Google Cloud API key required");
      return new GoogleCloudTTSProvider(apiKey);
    case "azure":
      if (!apiKey) throw new Error("Azure API key required");
      if (!region) throw new Error("Azure region required");
      return new AzureTTSProvider(apiKey, region);
    case "browser":
    case "browser-native":
      return new BrowserNativeSynthesisProvider();
    default:
      throw new Error(`Unknown synthesis provider: ${type}`);
  }
}