"use client";

import { useState, useRef, useCallback } from "react";
import type { KurLevel, Exercise, Gait } from "@/data/kur-levels";
import { GAIT_COLORS, GAIT_LABELS } from "@/data/kur-levels";
import { detectBPM, bpmMatchesGait } from "@/lib/bpm-detect";
import {
  generateMixTimeline,
  renderMix,
  audioBufferToWav,
} from "@/lib/audio-mixer";
import type { MixTrack, MixSegment } from "@/lib/audio-mixer";

interface UploadedTrack {
  file: File;
  name: string;
  bpm: number | null;
  detecting: boolean;
  assignedGait: string;
  audioBuffer: AudioBuffer | null;
  error?: string;
}

interface Props {
  level: KurLevel;
  programOrder: Exercise[];
  onBack: () => void;
}

export function MusicManager({ level, programOrder, onBack }: Props) {
  const [tracks, setTracks] = useState<UploadedTrack[]>([]);
  const [mixing, setMixing] = useState(false);
  const [mixReady, setMixReady] = useState(false);
  const [mixBlob, setMixBlob] = useState<Blob | null>(null);
  const [mixSegments, setMixSegments] = useState<MixSegment[]>([]);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Get unique gaits from program
  const gaits = [...new Set(programOrder.map((e) => e.gait).filter((g) => g !== "overgang"))];

  const handleFileUpload = useCallback(async (files: FileList | null) => {
    if (!files) return;

    for (const file of Array.from(files)) {
      if (!file.type.startsWith("audio/")) continue;

      const newTrack: UploadedTrack = {
        file,
        name: file.name.replace(/\.[^.]+$/, ""),
        bpm: null,
        detecting: true,
        assignedGait: gaits[0] || "trav",
        audioBuffer: null,
      };

      setTracks((prev) => [...prev, newTrack]);

      try {
        // Decode audio
        const arrayBuffer = await file.arrayBuffer();
        const audioContext = new AudioContext();
        const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        await audioContext.close();

        // Detect BPM
        let bpm: number | null = null;
        try {
          bpm = await detectBPM(file);
        } catch {
          // BPM detection can fail on some files
        }

        setTracks((prev) =>
          prev.map((t, i) =>
            t.file === file
              ? { ...t, bpm, detecting: false, audioBuffer }
              : t
          )
        );
      } catch (err) {
        setTracks((prev) =>
          prev.map((t) =>
            t.file === file
              ? { ...t, detecting: false, error: "Kunne ikke læse filen" }
              : t
          )
        );
      }
    }
  }, [tracks.length, gaits]);

  const removeTrack = (index: number) => {
    setTracks((prev) => prev.filter((_, i) => i !== index));
    setMixReady(false);
  };

  const updateGait = (index: number, gait: string) => {
    setTracks((prev) =>
      prev.map((t, i) => (i === index ? { ...t, assignedGait: gait } : t))
    );
    setMixReady(false);
  };

  const handleMix = async () => {
    const validTracks = tracks.filter((t) => t.audioBuffer);
    if (validTracks.length === 0) return;

    setMixing(true);

    try {
      const mixTracks: MixTrack[] = validTracks.map((t) => ({
        file: t.file,
        audioBuffer: t.audioBuffer!,
        bpm: t.bpm || 100,
        assignedGait: t.assignedGait,
      }));

      // Parse total duration from level
      const [minStr] = level.timeMin.split(":");
      const [maxStr, maxSec] = level.timeMax.split(":");
      const totalSec = (parseInt(maxStr) * 60 + parseInt(maxSec || "0"));

      const exercises = programOrder
        .filter((e) => e.gait !== "overgang")
        .map((e) => ({ gait: e.gait, name: e.name }));

      const segments = generateMixTimeline(mixTracks, exercises, totalSec);
      setMixSegments(segments);

      const mixedBuffer = await renderMix(mixTracks, segments, totalSec);
      const wavBlob = audioBufferToWav(mixedBuffer);

      setMixBlob(wavBlob);
      setMixReady(true);

      // Create preview URL
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      const url = URL.createObjectURL(wavBlob);
      setPreviewUrl(url);
    } catch (err) {
      console.error("Mix failed:", err);
    } finally {
      setMixing(false);
    }
  };

  const downloadMix = () => {
    if (!mixBlob) return;
    const url = URL.createObjectURL(mixBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `freestyle-mix.wav`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Check which gaits have tracks assigned
  const gaitCoverage = gaits.map((gait) => ({
    gait,
    covered: tracks.some((t) => t.assignedGait === gait && t.audioBuffer),
  }));

  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Musik</h2>
      <p className="text-gray-600 mb-6">
        Upload musik til hver gangart. Systemet detecter automatisk BPM og mixer
        musikken baseret på dit program.
      </p>

      {/* Gait coverage overview */}
      <div className="flex gap-2 mb-6">
        {gaitCoverage.map(({ gait, covered }) => (
          <div
            key={gait}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm ${
              covered
                ? "bg-green-100 text-green-800"
                : "bg-gray-100 text-gray-500"
            }`}
          >
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: GAIT_COLORS[gait as Gait] }}
            />
            {GAIT_LABELS[gait as Gait]}
            {covered ? " \u2713" : " mangler"}
          </div>
        ))}
      </div>

      {/* Upload area */}
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors mb-6"
      >
        <p className="text-gray-600 font-medium">
          Klik her eller træk filer hertil
        </p>
        <p className="text-sm text-gray-400 mt-1">MP3, WAV, OGG, M4A</p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="audio/*"
          className="hidden"
          onChange={(e) => handleFileUpload(e.target.files)}
        />
      </div>

      {/* Track list */}
      {tracks.length > 0 && (
        <div className="space-y-3 mb-6">
          {tracks.map((track, i) => (
            <div
              key={i}
              className="bg-white rounded-xl border border-gray-200 p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-gray-900 truncate">
                    {track.name}
                  </h4>

                  <div className="flex items-center gap-3 mt-2">
                    {/* BPM */}
                    <div className="text-sm">
                      {track.detecting ? (
                        <span className="text-gray-400">Analyserer BPM...</span>
                      ) : track.bpm ? (
                        <span className="font-mono font-bold text-gray-700">
                          {track.bpm} BPM
                        </span>
                      ) : (
                        <span className="text-gray-400">BPM ukendt</span>
                      )}
                    </div>

                    {/* BPM match indicator */}
                    {track.bpm && !track.detecting && (
                      (() => {
                        const match = bpmMatchesGait(track.bpm, track.assignedGait);
                        return match.match ? (
                          <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded">
                            Passer til {GAIT_LABELS[track.assignedGait as Gait]} ({match.ideal})
                          </span>
                        ) : (
                          <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
                            Passer måske ikke ({match.ideal} anbefalet)
                          </span>
                        );
                      })()
                    )}
                  </div>

                  {/* Gait selector */}
                  <div className="flex gap-1.5 mt-3">
                    {gaits.map((gait) => (
                      <button
                        key={gait}
                        onClick={() => updateGait(i, gait)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          track.assignedGait === gait
                            ? "text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                        style={
                          track.assignedGait === gait
                            ? { backgroundColor: GAIT_COLORS[gait as Gait] }
                            : undefined
                        }
                      >
                        {GAIT_LABELS[gait as Gait]}
                      </button>
                    ))}
                  </div>

                  {track.error && (
                    <p className="text-sm text-red-600 mt-2">{track.error}</p>
                  )}
                </div>

                <button
                  onClick={() => removeTrack(i)}
                  className="text-gray-400 hover:text-red-600 text-lg"
                >
                  \u2715
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mix button */}
      {tracks.some((t) => t.audioBuffer) && (
        <div className="bg-white rounded-xl border border-gray-200 p-6">
          <h3 className="font-semibold text-gray-900 mb-3">Auto-mix</h3>
          <p className="text-sm text-gray-600 mb-4">
            Mixer automatisk din musik baseret på programmet. Musikken crossfader
            mellem numrene ved gangartsskift.
          </p>

          {/* Mix timeline preview */}
          {mixSegments.length > 0 && (
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                Mix-tidslinje
              </h4>
              <div className="flex rounded-lg overflow-hidden h-8">
                {mixSegments.map((seg, i) => {
                  const duration = seg.endTime - seg.startTime;
                  const totalDur = mixSegments[mixSegments.length - 1]?.endTime || 1;
                  const widthPct = (duration / totalDur) * 100;
                  const track = tracks[seg.trackIndex];

                  return (
                    <div
                      key={i}
                      className="flex items-center justify-center text-xs text-white font-medium truncate px-1"
                      style={{
                        width: `${widthPct}%`,
                        backgroundColor: GAIT_COLORS[seg.gait as Gait] || "#6b7280",
                        opacity: 0.85,
                      }}
                      title={`${seg.exerciseName} (${Math.round(seg.startTime)}s - ${Math.round(seg.endTime)}s)`}
                    >
                      {GAIT_LABELS[seg.gait as Gait] || seg.gait}
                    </div>
                  );
                })}
              </div>
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>0:00</span>
                <span>
                  {Math.floor((mixSegments[mixSegments.length - 1]?.endTime || 0) / 60)}:
                  {String(Math.round((mixSegments[mixSegments.length - 1]?.endTime || 0) % 60)).padStart(2, "0")}
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <button
              onClick={handleMix}
              disabled={mixing}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors"
            >
              {mixing ? "Mixer..." : mixReady ? "Mix igen" : "Generer mix"}
            </button>

            {mixReady && previewUrl && (
              <>
                <audio ref={audioRef} src={previewUrl} />
                <button
                  onClick={() => audioRef.current?.play()}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Afspil preview
                </button>
                <button
                  onClick={() => audioRef.current?.pause()}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Stop
                </button>
                <button
                  onClick={downloadMix}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Download WAV
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-6 bg-gray-50 border border-gray-200 rounded-xl p-4">
        <p className="text-xs text-gray-500">
          Du er selv ansvarlig for at have de nødvendige rettigheder til den musik du uploader.
          Vi anbefaler at licensere musik via{" "}
          <a
            href="https://music.clicknclear.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 underline"
          >
            ClicknClear
          </a>{" "}
          for brug til stævner.
        </p>
      </div>

      <div className="flex justify-between mt-6">
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
