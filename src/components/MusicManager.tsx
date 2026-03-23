"use client";

import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import type { KurLevel, Exercise, Gait } from "@/data/kur-levels";
import { GAIT_COLORS, GAIT_LABELS } from "@/data/kur-levels";
import { createMusicProvider } from "@/lib/music-provider";
import { calculateGaitDurations, maxLyricsForDuration } from "@/lib/gait-duration";
import type { GaitDuration } from "@/lib/gait-duration";

// Genre presets (D-10)
const MUSIC_GENRES = ["Klassisk", "Pop/Rock", "Filmmusik", "Jazz", "Elektronisk"];

// Language options for vocals
const LANGUAGES = [
  { value: "da", label: "Dansk" },
  { value: "en", label: "Engelsk" },
  { value: "instrumental", label: "Instrumental (ingen vokal)" },
];

// Max characters for Suno lyrics (V5 model)
const MAX_LYRICS_CHARS = 5000;

// Danish prompt templates per gait (D-12)
const GAIT_PROMPT_TEMPLATES: Record<string, string> = {
  skridt: "roligt og majestaetisk skridt-tempo",
  trav: "energisk og rytmisk trav-tempo",
  galop: "kraftfuldt og fremadrettet galop-tempo",
  passage: "ophoejet og svaevende passage-tempo",
  piaffe: "samlet og kraftfuldt piaffe-tempo",
};

// BPM midpoints from bpm-detect.ts ranges (D-07)
const GAIT_BPM_TARGETS: Record<string, number> = {
  skridt: 57,
  trav: 81,
  galop: 102,
  passage: 62,
  piaffe: 62,
};

// Fallback duration if calculation fails
const FALLBACK_DURATION_SEC = 45;

function buildDefaultPrompt(genre: string, gait: string, bpm: number): string {
  const template = GAIT_PROMPT_TEMPLATES[gait] || gait;
  return `${genre} musik, ${template}, ${bpm} BPM`;
}

interface GaitTrack {
  gait: string;
  prompt: string;       // Style/mood description (goes to Suno "style" field)
  lyrics: string;       // Song lyrics (goes to Suno "prompt" field) — empty = instrumental
  lyricsEdited: boolean;
  promptEdited: boolean;
  bpm: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  generating: boolean;
  error: string | null;
}

interface Props {
  level: KurLevel;
  programOrder: Exercise[];
  onBack: () => void;
}

export function MusicManager({ level, programOrder, onBack }: Props) {
  const [genre, setGenre] = useState("Klassisk");
  const [language, setLanguage] = useState("da");
  const [tracks, setTracks] = useState<GaitTrack[]>([]);
  const [generatingAll, setGeneratingAll] = useState(false);
  const [playingIndex, setPlayingIndex] = useState<number | null>(null);
  const [playbackProgress, setPlaybackProgress] = useState<Record<number, number>>({});
  const [playbackDuration, setPlaybackDuration] = useState<Record<number, number>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Get unique gaits from program (exclude overgang)
  const gaits = [...new Set(programOrder.map((e) => e.gait).filter((g) => g !== "overgang"))];

  // Calculate duration per gait based on coefficient weighting
  const gaitDurations = useMemo(
    () => calculateGaitDurations(level, programOrder),
    [level, programOrder],
  );

  const getDuration = (gait: string): number => {
    const found = gaitDurations.find((d: GaitDuration) => d.gait === gait);
    return found?.durationSec || FALLBACK_DURATION_SEC;
  };

  // Initialize tracks when gaits change
  useEffect(() => {
    setTracks(
      gaits.map((gait) => ({
        gait,
        prompt: buildDefaultPrompt(genre, gait, GAIT_BPM_TARGETS[gait] || 80),
        lyrics: "",
        lyricsEdited: false,
        promptEdited: false,
        bpm: GAIT_BPM_TARGETS[gait] || 80,
        audioBlob: null,
        audioUrl: null,
        generating: false,
        error: null,
      }))
    );
    // Only reinitialize when programOrder changes (gaits derived from it)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [programOrder]);

  // Update prompts when genre changes (only for non-edited prompts)
  useEffect(() => {
    setTracks((prev) =>
      prev.map((t) =>
        t.promptEdited
          ? t
          : { ...t, prompt: buildDefaultPrompt(genre, t.gait, t.bpm) }
      )
    );
  }, [genre]);

  // Cleanup object URLs on unmount
  useEffect(() => {
    return () => {
      tracks.forEach((t) => {
        if (t.audioUrl) URL.revokeObjectURL(t.audioUrl);
      });
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGenerate = useCallback(async (gaitIndex: number) => {
    setTracks((prev) =>
      prev.map((t, i) =>
        i === gaitIndex ? { ...t, generating: true, error: null } : t
      )
    );

    try {
      const provider = createMusicProvider();
      const track = tracks[gaitIndex];
      if (!track) return;

      const isInstrumental = language === "instrumental";
      const durationSec = getDuration(track.gait);
      const arrayBuffer = await provider.generateTrack({
        style: track.prompt,
        lyrics: isInstrumental ? "" : track.lyrics,
        bpm: track.bpm,
        durationSec,
        instrumental: isInstrumental,
        language,
      }
      );

      const blob = new Blob([arrayBuffer], { type: "audio/wav" });
      const url = URL.createObjectURL(blob);

      setTracks((prev) =>
        prev.map((t, i) => {
          if (i !== gaitIndex) return t;
          // Revoke old URL to prevent memory leak
          if (t.audioUrl) URL.revokeObjectURL(t.audioUrl);
          return {
            ...t,
            audioBlob: blob,
            audioUrl: url,
            generating: false,
            error: null,
          };
        })
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : "Ukendt fejl ved generering";
      setTracks((prev) =>
        prev.map((t, i) =>
          i === gaitIndex
            ? { ...t, generating: false, error: message }
            : t
        )
      );
    }
  }, [tracks]);

  const handleRegenerate = useCallback(async (gaitIndex: number) => {
    const track = tracks[gaitIndex];
    if (track?.audioBlob) {
      const confirmed = window.confirm("Erstat nuvaerende musik?");
      if (!confirmed) return;
    }
    // Stop playback if this track is playing
    if (playingIndex === gaitIndex) {
      audioRef.current?.pause();
      setPlayingIndex(null);
    }
    await handleGenerate(gaitIndex);
  }, [tracks, playingIndex, handleGenerate]);

  const handleGenerateAll = useCallback(async () => {
    setGeneratingAll(true);
    for (let i = 0; i < tracks.length; i++) {
      await handleGenerate(i);
    }
    setGeneratingAll(false);
  }, [tracks.length, handleGenerate]);

  const handlePromptChange = useCallback((gaitIndex: number, value: string) => {
    setTracks((prev) =>
      prev.map((t, i) =>
        i === gaitIndex ? { ...t, prompt: value, promptEdited: true } : t
      )
    );
  }, []);

  const handleLyricsChange = useCallback((gaitIndex: number, value: string, maxChars: number) => {
    if (value.length > maxChars) return;
    setTracks((prev) =>
      prev.map((t, i) =>
        i === gaitIndex ? { ...t, lyrics: value, lyricsEdited: true } : t
      )
    );
  }, []);

  const handlePlay = useCallback((gaitIndex: number) => {
    const track = tracks[gaitIndex];
    if (!track?.audioUrl) return;

    // Pause current if different track
    if (audioRef.current && playingIndex !== null && playingIndex !== gaitIndex) {
      audioRef.current.pause();
    }

    if (playingIndex === gaitIndex && audioRef.current) {
      // Toggle pause/play
      if (audioRef.current.paused) {
        audioRef.current.play();
      } else {
        audioRef.current.pause();
        setPlayingIndex(null);
        return;
      }
    } else {
      // Play new track
      const audio = new Audio(track.audioUrl);
      audioRef.current = audio;

      audio.ontimeupdate = () => {
        setPlaybackProgress((prev) => ({ ...prev, [gaitIndex]: audio.currentTime }));
      };
      audio.onloadedmetadata = () => {
        setPlaybackDuration((prev) => ({ ...prev, [gaitIndex]: audio.duration }));
      };
      audio.onended = () => {
        setPlayingIndex(null);
        setPlaybackProgress((prev) => ({ ...prev, [gaitIndex]: 0 }));
      };

      audio.play();
    }
    setPlayingIndex(gaitIndex);
  }, [tracks, playingIndex]);

  const handleVolumeChange = useCallback((value: number) => {
    if (audioRef.current) {
      audioRef.current.volume = value;
    }
  }, []);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const anyGenerating = tracks.some((t) => t.generating);

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Musik</h2>
      <p className="text-gray-600 mb-6">
        Generer musik til hver gangart med AI. Vaelg genre og tilpas prompts.
      </p>

      {/* Genre + Language selectors */}
      <div className="mb-6 flex gap-4 flex-wrap">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Genre
          </label>
          <select
            value={genre}
            onChange={(e) => setGenre(e.target.value)}
            className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {MUSIC_GENRES.map((g) => (
              <option key={g} value={g}>
                {g}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sprog
          </label>
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            className="w-full max-w-xs px-4 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Generate all button (D-23) */}
      <div className="mb-6">
        <button
          onClick={handleGenerateAll}
          disabled={anyGenerating || generatingAll}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
        >
          {generatingAll ? "Genererer al musik..." : "Generer al musik"}
        </button>
      </div>

      {/* Per-gait cards (D-25) */}
      <div className="space-y-4 mb-6">
        {tracks.map((track, i) => (
          <div
            key={track.gait}
            className="bg-white rounded-xl border border-gray-200 p-5"
          >
            {/* Header: gait name + BPM + duration badges */}
            <div className="flex items-center gap-3 mb-3">
              <div
                className="w-3.5 h-3.5 rounded-full"
                style={{ backgroundColor: GAIT_COLORS[track.gait as Gait] }}
              />
              <h3 className="font-semibold text-gray-900">
                {GAIT_LABELS[track.gait as Gait]}
              </h3>
              <span className="text-xs font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                {track.bpm} BPM
              </span>
              <span className="text-xs font-mono bg-blue-50 text-blue-600 px-2 py-0.5 rounded">
                {Math.floor(getDuration(track.gait) / 60)}:{String(getDuration(track.gait) % 60).padStart(2, "0")}
              </span>
            </div>

            {/* Style prompt */}
            <div className="mb-3">
              <label className="block text-xs text-gray-500 mb-1">
                Stil / mood
              </label>
              <textarea
                value={track.prompt}
                onChange={(e) => handlePromptChange(i, e.target.value)}
                rows={2}
                maxLength={1000}
                className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <div className="text-right text-xs text-gray-400 mt-0.5">
                {track.prompt.length}/1000
              </div>
            </div>

            {/* Lyrics textarea (only shown when not instrumental) */}
            {language !== "instrumental" && (() => {
              const maxChars = maxLyricsForDuration(getDuration(track.gait));
              return (
                <div className="mb-3">
                  <label className="block text-xs text-gray-500 mb-1">
                    Sangtekst (valgfri — lad tom for AI-genereret tekst)
                  </label>
                  <textarea
                    value={track.lyrics}
                    onChange={(e) => handleLyricsChange(i, e.target.value, maxChars)}
                    rows={3}
                    maxLength={maxChars}
                    placeholder="Skriv sangtekst her, eller lad feltet være tomt..."
                    className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                  <div className="text-right text-xs text-gray-400 mt-0.5">
                    {track.lyrics.length}/{maxChars} tegn
                  </div>
                </div>
              );
            })()}

            {/* Generate / Regenerate buttons */}
            <div className="flex items-center gap-3 mb-3">
              {!track.audioBlob ? (
                <button
                  onClick={() => handleGenerate(i)}
                  disabled={track.generating || generatingAll}
                  className="px-4 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
                >
                  Generer
                </button>
              ) : (
                <button
                  onClick={() => handleRegenerate(i)}
                  disabled={track.generating || generatingAll}
                  className="px-4 py-1.5 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
                >
                  Generer igen
                </button>
              )}
            </div>

            {/* Loading state (D-20, D-21) */}
            {track.generating && (
              <div className="flex items-center gap-3 py-3">
                <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-gray-600">
                  Genererer musik... (~10-15 sek)
                </span>
              </div>
            )}

            {/* Error state (D-22) */}
            {track.error && (
              <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-700">{track.error}</p>
                <button
                  onClick={() => handleGenerate(i)}
                  className="mt-2 px-3 py-1 bg-red-600 text-white text-xs rounded hover:bg-red-700 transition-colors"
                >
                  Proev igen
                </button>
              </div>
            )}

            {/* Audio player (D-14, D-15, D-16) */}
            {track.audioUrl && !track.generating && (
              <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  {/* Play/Pause button */}
                  <button
                    onClick={() => handlePlay(i)}
                    className="w-9 h-9 flex items-center justify-center bg-green-600 text-white rounded-full hover:bg-green-700 transition-colors flex-shrink-0"
                  >
                    {playingIndex === i ? (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                        <rect x="2" y="1" width="4" height="12" rx="1" />
                        <rect x="8" y="1" width="4" height="12" rx="1" />
                      </svg>
                    ) : (
                      <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor">
                        <path d="M2 1.5v11l10-5.5z" />
                      </svg>
                    )}
                  </button>

                  {/* Progress bar (D-15) */}
                  <div className="flex-1">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all duration-200"
                        style={{
                          width: `${playbackDuration[i] ? (playbackProgress[i] || 0) / playbackDuration[i] * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>{formatTime(playbackProgress[i] || 0)}</span>
                      <span>{formatTime(playbackDuration[i] || 0)}</span>
                    </div>
                  </div>

                  {/* Volume slider (D-16) */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" className="text-gray-400">
                      <path d="M2 5.5h2l3-3v11l-3-3H2a1 1 0 01-1-1v-3a1 1 0 011-1z" strokeWidth="1.2" fill="currentColor" />
                      <path d="M10 4.5c.7.7 1 1.6 1 2.5s-.3 1.8-1 2.5" strokeWidth="1.2" strokeLinecap="round" />
                    </svg>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.1"
                      defaultValue="1"
                      onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
                      className="w-20 h-1.5 accent-green-600"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Disclaimer */}
      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 mb-6">
        <p className="text-xs text-gray-500">
          Musik genereret med AI (Suno). Til brug i dressur freestyle.
        </p>
      </div>

      {/* Navigation */}
      <div className="flex justify-between">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          Tilbage
        </button>
      </div>
    </div>
  );
}
