"use client";
import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { Button, Card, Badge, ProgressBar, Input, Textarea, Select } from "@/components/ui";
import { createAudioRecorder, createAudioPlayer, checkAudioSupport } from "@/lib/voice/audio-session-manager";

interface VoiceInterviewRoomProps {
  sessionId: string;
  userId: string;
}

interface Session {
  id: string;
  mode: string;
  targetRole: string | null;
  difficulty: string;
  interviewStyle: string;
  feedbackMode: string;
  questionCount: number;
  durationMinutes: number;
  status: string;
  startedAt: string | null;
  expiresAt: string | null;
  voiceMode: "TEXT_ONLY" | "VOICE_ONLY" | "HYBRID";
  voiceSession?: {
    id: string;
    voiceMode: "TEXT_ONLY" | "VOICE_ONLY" | "HYBRID";
    language: string;
    voiceId?: string;
    deliveryAnalyticsEnabled: boolean;
    processingStatus: string;
  };
  questions: Question[];
  answers: Answer[];
  evaluations: Evaluation[];
  configuration: any;
}

interface Question {
  id: string;
  sequenceNumber: number;
  turnType: string;
  questionType: string;
  questionText: string;
  topicTags: string[];
  difficulty: string;
  sourceType: string;
  sourceReference: string | null;
  evaluationRubric: any;
  expectedAnswerMetadata: any;
  createdAt: string;
}

interface Answer {
  id: string;
  sessionId: string;
  questionId: string;
  answerText: string | null;
  answerCode: string | null;
  programmingLanguage: string | null;
  status: string;
  submittedAt: string;
}

interface Evaluation {
  id: string;
  questionId: string;
  answerId: string;
  overallScore: number | null;
  dimensionScores: any[];
  strengths: string[];
  improvements: string[];
  missingConcepts: string[];
  evaluationStatus: string;
  createdAt: string;
}

interface VoiceCapture {
  id: string;
  captureStatus: string;
  audioDuration?: number;
  transcript?: {
    fullText: string;
    confidence?: number;
    isFinal: boolean;
    segments?: { index: number; text: string; startMs?: number; endMs?: number; confidence?: number }[];
  };
}

const getDifficultyColor = (diff: string) => {
  switch (diff) {
    case "BEGINNER": return "var(--color-success)";
    case "INTERMEDIATE": return "var(--color-warning)";
    case "ADVANCED": return "var(--color-error)";
    default: return "var(--color-primary)";
  }
};

const getTurnTypeBadge = (type: string) => {
  const colors: Record<string, string> = {
    QUESTION: "var(--color-primary)",
    FOLLOW_UP: "var(--color-info)",
    HINT: "var(--color-warning)",
    CLARIFICATION: "var(--color-warning)",
    END: "var(--color-success)",
  };
  const labels: Record<string, string> = {
    QUESTION: "Question",
    FOLLOW_UP: "Follow-up",
    HINT: "Hint",
    CLARIFICATION: "Clarification",
    END: "Complete",
  };
  return (
    <span className="badge" style={{ background: colors[type] || "var(--color-primary)" }}>
      {labels[type] || type}
    </span>
  );
};

function formatTime(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return h > 0 ? `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}` : `${m}:${s.toString().padStart(2, "0")}`;
}

export function VoiceInterviewRoomClient({ sessionId, userId }: VoiceInterviewRoomProps) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answerText, setAnswerText] = useState("");
  const [answerCode, setAnswerCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [showHint, setShowHint] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [recording, setRecording] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [transcript, setTranscript] = useState("");
  const [showTranscriptEditor, setShowTranscriptEditor] = useState(false);
  const [editedTranscript, setEditedTranscript] = useState("");
  const [synthesizing, setSynthesizing] = useState(false);
  const [playingAudio, setPlayingAudio] = useState(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const deadlineRef = useRef<number>(0);
  const timeRemaining = useRef(0);
  const recorderRef = useRef<any>(null);
  const playerRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const fetchSession = useCallback(async () => {
    try {
      const res = await fetch(`/api/mock-interviews/${sessionId}`);
      if (!res.ok) throw new Error("Failed to load session");
      const data = await res.json();
      setSession(data.mockInterview);
      if (data.mockInterview.expiresAt) {
        deadlineRef.current = new Date(data.mockInterview.expiresAt).getTime();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load session");
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    fetchSession();
    // Check voice support
    const support = checkAudioSupport();
    setVoiceSupported(support.recording && support.playback);
  }, [fetchSession]);

  // Timer
  useEffect(() => {
    if (!deadlineRef.current) return;
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((deadlineRef.current - Date.now()) / 1000));
      timeRemaining.current = remaining;
      if (remaining <= 0) handleTimeUp();
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [deadlineRef.current]);

  const handleTimeUp = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    await completeSession(true);
  };

  // Audio level visualization
  const startAudioLevelMonitoring = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (!analyserRef.current) {
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
    }
  };

  const updateAudioLevel = () => {
    if (analyserRef.current) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(Math.min(100, avg * 2));
    }
    if (recording) {
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  };

  // Recording
  const startRecording = async () => {
    if (!session) return;
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    try {
      const support = checkAudioSupport();
      if (!support.recording) {
        alert("Voice recording not supported in this browser");
        return;
      }

      // Create capture record
      const res = await fetch("/api/mock-interviews/voice/captures", {
        method: "POST",
        body: (() => {
          const fd = new FormData();
          fd.append("sessionId", sessionId);
          fd.append("questionId", getCurrentQuestion()?.id || "");
          return fd;
        })(),
      });

      if (!res.ok) throw new Error("Failed to create capture record");
      const { capture } = await res.json();

      // Create recorder
      const recorder = createAudioRecorder({ mimeType: "audio/webm;codecs=opus" });
      recorderRef.current = recorder;

      await recorder.start({
        onStart: () => {
          setRecording(true);
          setAudioLevel(0);
          startAudioLevelMonitoring();
          animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
        },
        onDataAvailable: (blob) => {
          // Could stream to server for real-time transcription
        },
        onStop: async (blob) => {
          setRecording(false);
          if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);

          // Upload audio
          await uploadAudio(capture.id, blob);
        },
        onError: (error) => {
          console.error("Recording error:", error);
          setRecording(false);
        },
        onTimeUpdate: (duration) => {
          // Could show recording duration
        },
      });

      // Store capture ID for upload
      (window as any).__currentCaptureId = capture.id;
    } catch (error) {
      console.error("Failed to start recording:", error);
      alert("Failed to start recording");
    }
  };

  const uploadAudio = async (captureId: string, blob: Blob) => {
    try {
      const formData = new FormData();
      formData.append("audio", blob, `capture-${Date.now()}.webm`);
      formData.append("captureId", captureId);

      const res = await fetch("/api/mock-interviews/voice/transcribe", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Transcription failed");
      }

      const { transcript } = await res.json();
      setTranscript(transcript.text);
      setEditedTranscript(transcript.text);
      setShowTranscriptEditor(true);
    } catch (error) {
      console.error("Transcription failed:", error);
      alert("Transcription failed. You can type your answer instead.");
    }
  };

  const stopRecording = async () => {
    if (recorderRef.current) {
      await recorderRef.current.stop();
      recorderRef.current = null;
    }
  };

  const cancelRecording = () => {
    if (recorderRef.current) {
      recorderRef.current.cancel();
      recorderRef.current = null;
    }
    setRecording(false);
  };

  // Audio playback
  const playInterviewerAudio = async (text: string) => {
    if (!session?.voiceSession) return;

    setSynthesizing(true);
    try {
      const res = await fetch("/api/mock-interviews/voice/synthesize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: session.id,
          text,
          voiceId: session.voiceSession.voiceId,
        }),
      });

      if (!res.ok) throw new Error("Synthesis failed");
      const { audioData, format } = await res.json();

      // Play audio
      const audio = new Audio(`data:audio/${format};base64,${audioData}`);
      playerRef.current = audio;
      setPlayingAudio(true);

      audio.onended = () => setPlayingAudio(false);
      audio.onerror = () => setPlayingAudio(false);
      await audio.play();
    } catch (error) {
      console.error("Synthesis failed:", error);
    } finally {
      setSynthesizing(false);
    }
  };

  const stopAudio = () => {
    if (playerRef.current) {
      playerRef.current.pause();
      playerRef.current = null;
    }
    setPlayingAudio(false);
  };

  // Auto-play interviewer question when it loads
  useEffect(() => {
    if (session?.voiceMode !== "TEXT_ONLY" && session?.questions[currentIndex]) {
      const question = session.questions[currentIndex];
      if (question) {
        const timer = setTimeout(() => {
          playInterviewerAudio(question.questionText);
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [currentIndex, session]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (recorderRef.current) recorderRef.current.cancel();
      if (playerRef.current) playerRef.current.pause();
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  const getCurrentQuestion = () => session?.questions[currentIndex];

  const isQuestionAnswered = (qId: string) => {
    const ans = session?.answers.find(a => a.questionId === qId && a.status === "SUBMITTED");
    return !!ans;
  };

  const navigateTo = (index: number) => {
    if (!session) return;
    if (index < 0 || index >= session.questions.length) return;
    if (!session.configuration?.allowBackNavigation && index < currentIndex) return;
    setCurrentIndex(index);
    setAnswerText("");
    setAnswerCode("");
    setHint(null);
    setShowHint(false);
    setShowTranscriptEditor(false);
  };

  const saveAnswer = async (text: string, code?: string) => {
    const currentQuestion = session?.questions[currentIndex];
    if (!currentQuestion) return;

    const timeout = saveTimeoutRef.current;
    if (timeout) clearTimeout(timeout);

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await fetch("/api/mock-interviews/answer", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sessionId,
            questionId: currentQuestion.id,
            answerText: text,
            answerCode: code,
            programmingLanguage: currentQuestion.questionType === "CODING" ? "javascript" : undefined,
          }),
        });
      } catch (e) {
        console.error("Failed to save answer:", e);
      }
    }, 500);
  };

  const handleTextChange = (text: string) => {
    setAnswerText(text);
    saveAnswer(text);
  };

  const handleCodeChange = (code: string) => {
    setAnswerCode(code);
    saveAnswer(answerText, code);
  };

  const handleHint = async () => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    try {
      const res = await fetch("/api/mock-interviews/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, questionId: currentQuestion.id, action: "hint" }),
      });
      if (!res.ok) throw new Error("Failed to get hint");
      const data = await res.json();
      setHint(data.hint);
      setShowHint(true);
    } catch (e) {
      console.error("Failed to get hint:", e);
    }
  };

  const handleSkip = async () => {
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion) return;

    try {
      const res = await fetch("/api/mock-interviews/hint", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, questionId: currentQuestion.id, action: "skip" }),
      });
      if (!res.ok) throw new Error("Failed to skip");
      navigateTo(currentIndex + 1);
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed to skip");
    }
  };

  const completeSession = async (force = false) => {
    if (!force && !window.confirm("Submit this interview? You cannot change answers after submitting.")) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/mock-interviews/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId }),
      });
      if (!res.ok) throw new Error("Failed to complete");
      window.location.href = `/mock-interviews/${sessionId}/results`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to complete");
      setSubmitting(false);
    }
  };

  const handleConfirmTranscript = async () => {
    // Submit the edited transcript as the final answer
    const currentQuestion = getCurrentQuestion();
    if (!currentQuestion || !editedTranscript.trim()) return;

    try {
      await fetch("/api/mock-interviews/answer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId,
          questionId: currentQuestion.id,
          answerText: editedTranscript,
        }),
      });
      setShowTranscriptEditor(false);
      setAnswerText(editedTranscript);
      setTranscript(editedTranscript);
    } catch (error) {
      alert("Failed to save transcript");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", padding: "48px" }}>
        <ProgressBar percent={50} />
      </div>
    );
  }

  if (error) {
    return (
      <Card style={{ padding: 24, textAlign: "center", background: "var(--color-error-bg)", borderColor: "var(--color-error)" }}>
        <h2>Error Loading Interview</h2>
        <p className="err">{error}</p>
        <a href={`/mock-interviews`} style={{ marginTop: 16, display: "inline-block" }}>
          <Button variant="outline">Back to Dashboard</Button>
        </a>
      </Card>
    );
  }

  if (!session) return null;

  const currentQuestion = getCurrentQuestion();
  const isAnswered = currentQuestion ? isQuestionAnswered(currentQuestion.id) : false;
  const evaluation = session?.evaluations.find(e => e.questionId === currentQuestion?.id);
  const answeredCount = session.answers.filter(a => a.status === "SUBMITTED").length;
  const voiceMode = session.voiceMode || "TEXT_ONLY";

  return (
    <div style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}>
      <header style={{ position: "sticky", top: 0, zIndex: 100, background: "var(--color-background)", borderBottom: "1px solid var(--color-border)", padding: "12px 16px" }}>
        <div style={{ maxWidth: "72rem", margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <Link href="/mock-interviews" style={{ textDecoration: "none", color: "var(--color-text-muted)" }}>
              ← Mock Interviews
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className="mut" style={{ fontSize: "0.85rem" }}>Question</span>
              <span style={{ fontWeight: 600, fontSize: "1.1rem" }}>{currentIndex + 1} / {session.questions.length}</span>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span className="mut">Answered:</span>
              <strong>{session.answers.filter(a => a.status === "SUBMITTED").length}</strong>
              <span className="mut">/</span>
              <strong>{session.questions.length}</strong>
            </div>
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
              <span className="mut">Voice:</span>
              <Badge style={{ background: voiceMode === "VOICE_ONLY" ? "var(--color-success)" : voiceMode === "HYBRID" ? "var(--color-warning)" : "var(--color-info)" }}>
                {voiceMode}
              </Badge>
            </div>
            <div style={{ width: 200 }}>
              <ProgressBar percent={(answeredCount / session.questions.length) * 100} />
            </div>
            <div style={{ fontSize: "1.25rem", fontWeight: 600, fontVariantNumeric: "tabular-nums", fontFamily: "monospace", color: timeRemaining.current <= 300 ? "var(--color-error)" : "var(--color-text)" }}>
              {formatTime(timeRemaining.current)}
            </div>
          </div>
        </div>
      </header>

      <main style={{ flex: 1, maxWidth: "72rem", margin: "0 auto", padding: "24px 16px", width: "100%" }}>
        <div>
          {currentQuestion && (
            <Card style={{ maxWidth: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingBottom: 12, borderBottom: "1px solid var(--color-border)" }}>
                <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                  <span className="badge" style={{ background: currentQuestion.turnType === "QUESTION" ? "var(--color-primary)" : currentQuestion.turnType === "FOLLOW_UP" ? "var(--color-info)" : currentQuestion.turnType === "HINT" ? "var(--color-warning)" : currentQuestion.turnType === "CLARIFICATION" ? "var(--color-warning)" : "var(--color-success)" }}>
                    {currentQuestion.turnType}
                  </span>
                  <span className="badge" style={{ background: getDifficultyColor(currentQuestion.difficulty) }}>{currentQuestion.difficulty}</span>
                  <span className="mut">Q{currentQuestion.sequenceNumber} of {session.questions.length}</span>
                </div>
              </div>

              <h3 style={{ marginBottom: 16, lineHeight: 1.5 }}>{currentQuestion?.questionText}</h3>

              {/* Voice Controls */}
              {session.voiceMode !== "TEXT_ONLY" && (
                <div style={{ marginBottom: 16, padding: 16, background: "var(--color-surface)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 12, flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ fontWeight: 600 }}>Microphone:</span>
                      {recording ? (
                        <>
                          <span className="badge" style={{ background: "var(--color-error)", animation: "pulse 1s infinite" }}>Recording</span>
                          <span style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                              <div style={{ width: 100, height: 8, background: "var(--color-border)", borderRadius: 4, overflow: "hidden" }}>
                                <div style={{ width: `${audioLevel}%`, height: "100%", background: "var(--color-error)", transition: "width 0.1s" }} />
                              </div>
                            </div>
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="badge" style={{ background: "var(--color-text-muted)" }}>Idle</span>
                          <Button
                            variant={recording ? "danger" : "solid"}
                            onClick={recording ? stopRecording : startRecording}
                            disabled={voiceMode === "TEXT_ONLY"}
                          >
                            {recording ? "Stop Recording" : "Start Recording"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {recording && (
                      <Button variant="outline" onClick={cancelRecording}>Cancel</Button>
                    )}
                    {!recording && transcript && (
                      <Button variant="outline" onClick={() => setShowTranscriptEditor(true)}>
                        Edit Transcript
                      </Button>
                    )}
                    {transcript && !recording && (
                      <Button variant="outline" onClick={() => playInterviewerAudio(currentQuestion?.questionText || "")} disabled={synthesizing || playingAudio}>
                        {synthesizing ? "Generating..." : playingAudio ? "Playing..." : "Play Question"}
                      </Button>
                    )}
                  </div>
                </div>
              )}

              {/* Answer input */}
              {currentQuestion?.questionType === "CODING" ? (
                <div style={{ marginBottom: 16 }}>
                  <Textarea
                    value={answerCode}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder={`Write your solution here...`}
                    style={{ minHeight: 300, fontFamily: "monospace", fontSize: 14 }}
                  />
                </div>
              ) : currentQuestion?.questionType === "SQL" ? (
                <div style={{ marginBottom: 16 }}>
                  <Textarea
                    value={answerCode || answerText}
                    onChange={(e) => handleCodeChange(e.target.value)}
                    placeholder="Write your SQL query here..."
                    style={{ minHeight: 200, fontFamily: "monospace", fontSize: 14 }}
                  />
                </div>
              ) : (
                <Textarea
                  value={answerText}
                  onChange={(e) => handleTextChange(e.target.value)}
                  placeholder="Type your answer here..."
                  style={{ minHeight: currentQuestion?.questionType === "LONG_ANSWER" ? 200 : 120 }}
                />
              )}

              {showHint && hint && (
                <div style={{ marginTop: 16, padding: 12, background: "var(--color-info-bg)", borderRadius: "8px", border: "1px solid var(--color-info)" }}>
                  <strong>Hint:</strong> {hint}
                </div>
              )}

              {/* Transcript Editor */}
              {showTranscriptEditor && transcript && (
                <div style={{ marginTop: 16, padding: 16, background: "var(--color-surface)", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                    <strong>Transcript (click to edit)</strong>
                    <div style={{ display: "flex", gap: 8 }}>
                      <Button variant="outline" small onClick={() => { setEditedTranscript(transcript); setShowTranscriptEditor(false); }}>Cancel</Button>
                      <Button variant="solid" small onClick={handleConfirmTranscript} disabled={!editedTranscript.trim()}>Save</Button>
                    </div>
                  </div>
                  <Textarea
                    value={editedTranscript}
                    onChange={(e) => setEditedTranscript(e.target.value)}
                    placeholder="Edit transcript..."
                    style={{ minHeight: 120 }}
                  />
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 24, paddingTop: 16, borderTop: "1px solid var(--color-border)" }}>
                <div style={{ display: "flex", gap: 8 }}>
                  {currentIndex > 0 && (
                    <Button variant="outline" onClick={() => navigateTo(currentIndex - 1)}>Previous</Button>
                  )}
                  {currentIndex < (session?.questions.length || 0) - 1 && (
                    <Button variant="outline" onClick={() => navigateTo(currentIndex + 1)}>Next</Button>
                  )}
                </div>
                {currentIndex === (session?.questions.length || 0) - 1 && (
                  <Button variant="solid" onClick={() => completeSession(true)} disabled={submitting}>
                    {submitting ? "Submitting..." : "Complete Interview"}
                  </Button>
                )}
              </div>

              {evaluation && (
                <div style={{ marginTop: 24, padding: 16, background: "var(--color-surface)", borderRadius: "8px" }}>
                  <h4 style={{ marginBottom: 8 }}>Feedback</h4>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 12, marginBottom: 12 }}>
                    <div>
                      <strong>Score:</strong> {evaluation.overallScore !== null ? `${evaluation.overallScore}/100` : "N/A"}
                    </div>
                    <div>
                      <strong>Status:</strong> {evaluation.evaluationStatus}
                    </div>
                  </div>
                  {evaluation.strengths.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <strong>Strengths:</strong>
                      <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                        {evaluation.strengths.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                  {evaluation.improvements.length > 0 && (
                    <div style={{ marginBottom: 8 }}>
                      <strong>Improvements:</strong>
                      <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                        {evaluation.improvements.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                  {evaluation.missingConcepts.length > 0 && (
                    <div>
                      <strong>Missing Concepts:</strong>
                      <ul style={{ marginTop: 4, paddingLeft: 20 }}>
                        {evaluation.missingConcepts.map((s, i) => <li key={i}>{s}</li>)}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </Card>
          )}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(48px, 1fr))", gap: 8, marginTop: 16 }}>
          {session.questions.map((q, i) => (
            <Button
              key={q.id}
              variant={i === currentIndex ? "solid" : isQuestionAnswered(q.id) ? "outline" : "outline"}
              small
              onClick={() => navigateTo(i)}
              style={{ aspectRatio: "1" }}
            >
              {i + 1}
            </Button>
          ))}
        </div>

        {showSubmitConfirm && (
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000 }}>
            <Card style={{ maxWidth: "400px", width: "90%", padding: 24 }}>
              <h3>Submit Interview?</h3>
              <p className="mut" style={{ marginTop: 8, marginBottom: 24 }}>
                You have answered {answeredCount} of {session.questions.length} questions.
                This action cannot be undone.
              </p>
              <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
                <Button variant="outline" onClick={() => setShowSubmitConfirm(false)}>Cancel</Button>
                <Button variant="danger" onClick={() => completeSession(true)} disabled={submitting}>
                  {submitting ? "Submitting..." : "Confirm Submit"}
                </Button>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
