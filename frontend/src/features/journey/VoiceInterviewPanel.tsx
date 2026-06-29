"use client";

import { Mic, Pause, Play, RotateCcw, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { InterviewQuestion } from "@/types/career";

interface SpeechResult {
  isFinal: boolean;
  0: { transcript: string };
}

interface SpeechResultList {
  length: number;
  [index: number]: SpeechResult;
}

interface SpeechEvent {
  resultIndex: number;
  results: SpeechResultList;
}

interface SpeechRecognitionLike {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: ((event: SpeechEvent) => void) | null;
  onerror: (() => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type RecognitionConstructor = new () => SpeechRecognitionLike;

interface VoiceWindow extends Window {
  SpeechRecognition?: RecognitionConstructor;
  webkitSpeechRecognition?: RecognitionConstructor;
}

export function getAdaptiveFollowUp(currentAnswer: string): string {
  if (currentAnswer.length < 60) {
    return "Can you add a specific situation, your action, and the outcome?";
  }
  if (!/\d|percent|percentage/i.test(currentAnswer)) {
    return "What measurable result or scale would make this evidence stronger?";
  }
  if (!/\b(result|outcome|helped|improved|reduced|increased)\b/i.test(currentAnswer)) {
    return "How did your action change the final result?";
  }
  return "What would you do differently if you faced this situation again?";
}

export function VoiceInterviewPanel({
  questions,
  answers,
  onTranscript,
}: {
  questions: InterviewQuestion[];
  answers: Record<string, string>;
  onTranscript: (questionId: string, transcript: string) => void;
}) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [status, setStatus] = useState<"idle" | "recording" | "paused">("idle");
  const [seconds, setSeconds] = useState(0);
  const [voiceDetected, setVoiceDetected] = useState(false);
  const [message, setMessage] = useState(
    "Choose a question, allow microphone access, and answer naturally.",
  );
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const baseTranscriptRef = useRef("");
  const currentQuestion = questions[questionIndex];

  useEffect(() => {
    if (status !== "recording") return;
    const timer = window.setInterval(() => setSeconds((value) => value + 1), 1000);
    return () => window.clearInterval(timer);
  }, [status]);

  useEffect(
    () => () => {
      recognitionRef.current?.abort();
      stopVoiceActivity();
    },
    [],
  );

  function stopVoiceActivity() {
    if (animationFrameRef.current !== null) {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    void audioContextRef.current?.close();
    audioContextRef.current = null;
    setVoiceDetected(false);
  }

  function monitorVoiceActivity(stream: MediaStream) {
    const context = new AudioContext();
    const analyser = context.createAnalyser();
    analyser.fftSize = 512;
    context.createMediaStreamSource(stream).connect(analyser);
    const samples = new Uint8Array(analyser.fftSize);
    audioContextRef.current = context;
    streamRef.current = stream;

    const sample = () => {
      analyser.getByteTimeDomainData(samples);
      let energy = 0;
      for (const value of samples) {
        const normalized = (value - 128) / 128;
        energy += normalized * normalized;
      }
      const rms = Math.sqrt(energy / samples.length);
      setVoiceDetected(rms > 0.035);
      animationFrameRef.current = window.requestAnimationFrame(sample);
    };
    sample();
  }

  async function startRecording() {
    setMessage("Requesting microphone access…");
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("Microphone capture is not available in this browser.");
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      monitorVoiceActivity(stream);

      const speechWindow = window as VoiceWindow;
      const Recognition =
        speechWindow.SpeechRecognition ?? speechWindow.webkitSpeechRecognition;
      if (!Recognition) {
        throw new Error(
          "Live transcription is not supported here. Use the text response field below.",
        );
      }

      const recognition = new Recognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-IN";
      baseTranscriptRef.current = answers[currentQuestion.id]?.trim() ?? "";
      recognition.onresult = (event) => {
        let transcript = "";
        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          transcript += event.results[index][0].transcript;
        }
        const base = baseTranscriptRef.current;
        onTranscript(
          currentQuestion.id,
          `${base}${base && transcript ? " " : ""}${transcript}`.trim(),
        );
      };
      recognition.onerror = () => {
        stopVoiceActivity();
        setStatus("idle");
        setMessage("ANIRA could not hear clearly. Retry or continue by typing.");
      };
      recognition.onend = () => {
        stopVoiceActivity();
        setStatus((current) => (current === "paused" ? "paused" : "idle"));
      };
      recognitionRef.current = recognition;
      recognition.start();
      setStatus("recording");
      setMessage("Listening and transcribing locally in this browser session.");
    } catch (error) {
      setStatus("idle");
      setMessage(
        error instanceof Error
          ? error.message
          : "Microphone access was unavailable. Continue by typing.",
      );
    }
  }

  function pauseRecording() {
    recognitionRef.current?.stop();
    stopVoiceActivity();
    setStatus("paused");
    setMessage("Interview paused. Your transcript is preserved.");
  }

  function stopRecording() {
    recognitionRef.current?.stop();
    stopVoiceActivity();
    setStatus("idle");
    setMessage("Answer captured. Review the transcript below before continuing.");
  }

  function retryAnswer() {
    recognitionRef.current?.abort();
    stopVoiceActivity();
    onTranscript(currentQuestion.id, "");
    baseTranscriptRef.current = "";
    setStatus("idle");
    setSeconds(0);
    setMessage("Transcript cleared. Start again when ready.");
  }

  function chooseQuestion(index: number) {
    if (status === "recording") stopRecording();
    setQuestionIndex(index);
    setSeconds(0);
    setMessage("Press start when you are ready to answer.");
  }

  const minutes = String(Math.floor(seconds / 60)).padStart(2, "0");
  const remainingSeconds = String(seconds % 60).padStart(2, "0");
  const currentAnswer = answers[currentQuestion.id]?.trim() ?? "";
  const followUp = getAdaptiveFollowUp(currentAnswer);

  return (
    <section className="voice-studio mb-6 rounded-[28px] border border-[var(--line)] p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-extrabold uppercase tracking-[0.16em] text-[var(--teal)]">
            Live voice interview
          </p>
          <h2 className="mt-2 text-xl font-extrabold">Speak first. Edit the transcript second.</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">{message}</p>
        </div>
        <div className="rounded-full border border-[var(--line)] px-3 py-1.5 font-mono text-sm">
          {minutes}:{remainingSeconds}
        </div>
      </div>

      <div className="mt-5 flex flex-wrap gap-2" aria-label="Interview question selector">
        {questions.map((question, index) => (
          <button
            key={question.id}
            type="button"
            className={`question-pill rounded-full px-3 py-2 text-xs font-extrabold ${
              index === questionIndex ? "active" : ""
            }`}
            onClick={() => chooseQuestion(index)}
          >
            Question {index + 1}
          </button>
        ))}
      </div>

      <div className="mt-5 rounded-2xl bg-black/15 p-4">
        <p className="font-bold">{currentQuestion.question}</p>
        <div
          className={`waveform mt-5 ${status === "recording" ? "active" : ""} ${voiceDetected ? "speaking" : ""}`}
          aria-label={status === "recording" ? (voiceDetected ? "Voice detected" : "Listening for voice") : "Voice activity idle"}
        >
          {Array.from({ length: 22 }).map((_, index) => (
            <span key={index} style={{ animationDelay: `${index * 45}ms` }} />
          ))}
        </div>
        {status === "recording" && (
          <p className="mt-2 text-center text-xs font-bold text-[var(--teal)]">
            {voiceDetected ? "Voice detected" : "Listening…"}
          </p>
        )}
      </div>

      {currentAnswer.length >= 20 && status !== "recording" && (
        <div className="mt-4 rounded-2xl border border-violet-400/25 bg-violet-400/10 p-4">
          <p className="text-[10px] font-black uppercase tracking-[0.14em] text-violet-300">
            Adaptive follow-up
          </p>
          <p className="mt-2 text-sm font-semibold">{followUp}</p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {status === "idle" && (
          <button type="button" className="primary flex items-center gap-2" onClick={startRecording}>
            <Mic size={16} /> Start voice answer
          </button>
        )}
        {status === "recording" && (
          <>
            <button type="button" className="secondary flex items-center gap-2" onClick={pauseRecording}>
              <Pause size={15} /> Pause
            </button>
            <button type="button" className="primary flex items-center gap-2" onClick={stopRecording}>
              <Square size={14} /> Finish answer
            </button>
          </>
        )}
        {status === "paused" && (
          <button type="button" className="primary flex items-center gap-2" onClick={startRecording}>
            <Play size={15} /> Resume
          </button>
        )}
        <button type="button" className="secondary flex items-center gap-2" onClick={retryAnswer}>
          <RotateCcw size={15} /> Retry
        </button>
      </div>
    </section>
  );
}
