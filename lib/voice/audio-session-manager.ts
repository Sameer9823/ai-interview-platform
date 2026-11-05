export interface AudioCaptureOptions {
  mimeType?: string;
  audioBitsPerSecond?: number;
  videoBitsPerSecond?: number;
  bitsPerSecond?: number;
}

export interface AudioRecorderState {
  status: "idle" | "recording" | "paused" | "stopped" | "error";
  duration: number;
  error?: string;
}

export interface AudioRecorderEvents {
  onDataAvailable?: (blob: Blob) => void;
  onStart?: () => void;
  onStop?: (blob: Blob) => void;
  onPause?: () => void;
  onResume?: () => void;
  onError?: (error: Error) => void;
  onTimeUpdate?: (duration: number) => void;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private stream: MediaStream | null = null;
  private chunks: Blob[] = [];
  private startTime: number = 0;
  private timerInterval: ReturnType<typeof setInterval> | null = null;
  private events: AudioRecorderEvents = {};
  private state: AudioRecorderState = { status: "idle", duration: 0 };

  constructor(private options: AudioCaptureOptions = {}) {
    this.options.mimeType = this.options.mimeType || this.getSupportedMimeType();
  }

  private getSupportedMimeType(): string {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm;codecs=pcm",
      "audio/ogg;codecs=opus",
      "audio/wav",
      "audio/mp3",
    ];

    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported) {
      for (const type of types) {
        if (MediaRecorder.isTypeSupported(type)) {
          return type;
        }
      }
    }
    return "audio/webm";
  }

  async start(events: AudioRecorderEvents = {}): Promise<void> {
    this.events = events;

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
        },
      });

      this.mediaRecorder = new MediaRecorder(this.stream, {
        mimeType: this.options.mimeType,
        audioBitsPerSecond: this.options.audioBitsPerSecond,
      });

      this.mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          this.chunks.push(event.data);
          this.events.onDataAvailable?.(event.data);
        }
      };

      this.mediaRecorder.onstart = () => {
        this.state = { status: "recording", duration: 0 };
        this.startTime = Date.now();
        this.timerInterval = setInterval(() => {
          this.state.duration = Date.now() - this.startTime;
          this.events.onTimeUpdate?.(this.state.duration);
        }, 100);
        this.events.onStart?.();
      };

      this.mediaRecorder.onstop = () => {
        this.state.status = "stopped";
        const blob = new Blob(this.chunks, { type: this.mediaRecorder?.mimeType || this.options.mimeType });
        this.events.onStop?.(blob);
        this.cleanup();
      };

      this.mediaRecorder.onpause = () => {
        this.state.status = "paused";
        this.events.onPause?.();
      };

      this.mediaRecorder.onresume = () => {
        this.state.status = "recording";
        this.events.onResume?.();
      };

      this.mediaRecorder.onerror = (event) => {
        this.state.status = "error";
        this.state.error = "Recording error";
        this.events.onError?.(new Error("MediaRecorder error"));
      };

      this.chunks = [];
      this.mediaRecorder.start(100); // Collect data every 100ms
    } catch (error) {
      this.state.status = "error";
      this.state.error = error instanceof Error ? error.message : "Failed to start recording";
      this.events.onError?.(error instanceof Error ? error : new Error("Unknown error"));
      throw error;
    }
  }

  pause(): void {
    if (this.mediaRecorder && this.state.status === "recording") {
      this.mediaRecorder.pause();
    }
  }

  resume(): void {
    if (this.mediaRecorder && this.state.status === "paused") {
      this.mediaRecorder.resume();
    }
  }

  stop(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || this.state.status === "idle") {
        reject(new Error("Not recording"));
        return;
      }

      const originalOnStop = this.mediaRecorder!.onstop;
      this.mediaRecorder!.onstop = () => {
        const blob = new Blob(this.chunks, { type: this.mediaRecorder?.mimeType || this.options.mimeType });
        this.events.onStop?.(blob);
        resolve(blob);
        if (originalOnStop) originalOnStop.call(this.mediaRecorder!, new Event("stop"));
        this.cleanup();
      };

      this.mediaRecorder!.stop();
    });
  }

  cancel(): void {
    if (this.mediaRecorder && this.state.status !== "idle") {
      this.mediaRecorder.stop();
      this.chunks = [];
      this.cleanup();
      this.state = { status: "idle", duration: 0 };
    }
  }

  getState(): AudioRecorderState {
    return { ...this.state };
  }

  getMimeType(): string {
    return this.options.mimeType || this.getSupportedMimeType();
  }

  getChunks(): Blob[] {
    return [...this.chunks];
  }

  private cleanup(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    if (this.stream) {
      this.stream.getTracks().forEach(track => track.stop());
      this.stream = null;
    }
    this.mediaRecorder = null;
  }

  static isSupported(): boolean {
    return typeof navigator !== "undefined" && 
           navigator.mediaDevices?.getUserMedia !== undefined && 
           typeof MediaRecorder !== "undefined";
  }

  static getSupportedMimeTypes(): string[] {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm;codecs=pcm",
      "audio/ogg;codecs=opus",
      "audio/wav",
      "audio/mp3",
    ];
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported) {
      return types.filter(t => MediaRecorder.isTypeSupported(t));
    }
    return [];
  }
}

export class AudioPlayer {
  private audio: HTMLAudioElement;
  private sourceUrl: string | null = null;

  constructor() {
    this.audio = new Audio();
    this.audio.preload = "auto";
  }

  async loadFromBlob(blob: Blob): Promise<void> {
    this.revokeSource();
    this.sourceUrl = URL.createObjectURL(blob);
    this.audio.src = this.sourceUrl;
    await new Promise<void>((resolve, reject) => {
      this.audio.oncanplaythrough = () => resolve();
      this.audio.onerror = () => reject(new Error("Failed to load audio"));
      this.audio.load();
    });
  }

  async loadFromUrl(url: string): Promise<void> {
    this.revokeSource();
    this.sourceUrl = url;
    this.audio.src = url;
    await new Promise<void>((resolve, reject) => {
      this.audio.oncanplaythrough = () => resolve();
      this.audio.onerror = () => reject(new Error("Failed to load audio"));
      this.audio.load();
    });
  }

  play(): Promise<void> {
    return this.audio.play();
  }

  pause(): void {
    this.audio.pause();
  }

  stop(): void {
    this.audio.pause();
    this.audio.currentTime = 0;
  }

  setVolume(volume: number): void {
    this.audio.volume = Math.max(0, Math.min(1, volume));
  }

  setPlaybackRate(rate: number): void {
    this.audio.playbackRate = Math.max(0.25, Math.min(4, rate));
  }

  getCurrentTime(): number {
    return this.audio.currentTime;
  }

  getDuration(): number {
    return this.audio.duration;
  }

  isPlaying(): boolean {
    return !this.audio.paused && !this.audio.ended;
  }

  onEnded(callback: () => void): () => void {
    this.audio.onended = callback;
    return () => { this.audio.onended = null; };
  }

  onTimeUpdate(callback: (currentTime: number) => void): () => void {
    this.audio.ontimeupdate = () => callback(this.audio.currentTime);
    return () => { this.audio.ontimeupdate = null; };
  }

  onError(callback: (error: Error) => void): () => void {
    this.audio.onerror = () => callback(new Error("Audio playback error"));
    return () => { this.audio.onerror = null; };
  }

  private revokeSource(): void {
    if (this.sourceUrl) {
      URL.revokeObjectURL(this.sourceUrl);
      this.sourceUrl = null;
    }
  }

  destroy(): void {
    this.stop();
    this.revokeSource();
    this.audio.src = "";
  }

  static isSupported(): boolean {
    return typeof Audio !== "undefined";
  }
}

export function createAudioRecorder(options?: AudioCaptureOptions): AudioRecorder {
  return new AudioRecorder(options);
}

export function createAudioPlayer(): AudioPlayer {
  return new AudioPlayer();
}

export function getSupportedAudioFormats(): string[] {
  if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported) {
    const types = [
      "audio/webm;codecs=opus",
      "audio/webm;codecs=pcm",
      "audio/ogg;codecs=opus",
      "audio/wav",
      "audio/mp3",
    ];
    return types.filter(t => MediaRecorder.isTypeSupported(t));
  }
  return [];
}

export function checkAudioSupport(): {
  recording: boolean;
  playback: boolean;
  formats: string[];
} {
  return {
    recording: AudioRecorder.isSupported(),
    playback: AudioPlayer.isSupported(),
    formats: getSupportedAudioFormats(),
  };
}