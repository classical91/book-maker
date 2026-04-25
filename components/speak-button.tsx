"use client";

import { useEffect, useRef, useState } from "react";

function getBestVoice(): SpeechSynthesisVoice | null {
  const voices = window.speechSynthesis.getVoices();
  const preferred = [
    "Microsoft Aria Online (Natural) - English (United States)",
    "Microsoft Jenny Online (Natural) - English (United States)",
    "Google US English",
    "Samantha",
    "Karen",
    "Moira",
  ];
  for (const name of preferred) {
    const match = voices.find((v) => v.name === name);
    if (match) return match;
  }
  return voices.find((v) => v.lang.startsWith("en")) ?? null;
}

export function SpeakButton({ text }: { text: string }) {
  const [speaking, setSpeaking] = useState(false);
  const chunkRef = useRef<string[]>([]);
  const indexRef = useRef(0);

  useEffect(() => {
    return () => window.speechSynthesis.cancel();
  }, []);

  function speakChunk(chunks: string[], index: number) {
    if (index >= chunks.length) {
      setSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(chunks[index]);
    const voice = getBestVoice();
    if (voice) utterance.voice = voice;
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onend = () => speakChunk(chunks, index + 1);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }

  function handleClick() {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }

    // Split into sentence-level chunks to avoid browser cut-off on long text
    const chunks = text
      .split(/(?<=[.!?])\s+/)
      .reduce<string[]>((acc, sentence) => {
        const last = acc[acc.length - 1];
        if (last && last.length + sentence.length < 200) {
          acc[acc.length - 1] = last + " " + sentence;
        } else {
          acc.push(sentence);
        }
        return acc;
      }, []);

    chunkRef.current = chunks;
    indexRef.current = 0;
    setSpeaking(true);

    // Voices may not be loaded yet on first call
    if (window.speechSynthesis.getVoices().length === 0) {
      window.speechSynthesis.onvoiceschanged = () => speakChunk(chunks, 0);
    } else {
      speakChunk(chunks, 0);
    }
  }

  return (
    <button
      onClick={handleClick}
      title={speaking ? "Stop" : "Listen"}
      className={`inline-flex items-center gap-2 rounded-full border px-5 py-3 text-sm font-semibold transition ${
        speaking
          ? "border-[var(--accent)] bg-[var(--accent)] text-white"
          : "border-[var(--line)] text-[var(--muted)] hover:border-[var(--foreground)] hover:text-[var(--foreground)]"
      }`}
    >
      {speaking ? (
        <>
          <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
            <rect x="2" y="2" width="4" height="10" rx="1" />
            <rect x="8" y="2" width="4" height="10" rx="1" />
          </svg>
          Stop
        </>
      ) : (
        <>
          <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <polygon points="3,2 12,7.5 3,13" fill="currentColor" stroke="none" />
            <path d="M13 4.5c1 .9 1.5 2 1.5 3s-.5 2.1-1.5 3" />
          </svg>
          Listen
        </>
      )}
    </button>
  );
}
