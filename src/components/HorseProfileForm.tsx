import { TEMPERAMENT_OPTIONS, MUSIC_GENRES } from "@/data/strength-options";

interface Props {
  horseName: string;
  setHorseName: (name: string) => void;
  temperament: "calm" | "neutral" | "energetic";
  setTemperament: (t: "calm" | "neutral" | "energetic") => void;
  musicPreference: string;
  setMusicPreference: (p: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export function HorseProfileForm({
  horseName,
  setHorseName,
  temperament,
  setTemperament,
  musicPreference,
  setMusicPreference,
  onNext,
  onBack,
}: Props) {
  return (
    <div>
      <h2 className="text-xl font-semibold text-gray-900 mb-2">Om din hest</h2>
      <p className="text-gray-600 mb-6">
        Fortæl os lidt om din hest, så vi kan tilpasse programmet.
      </p>

      <div className="bg-white rounded-xl border border-gray-200 p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hestens navn
          </label>
          <input
            type="text"
            value={horseName}
            onChange={(e) => setHorseName(e.target.value)}
            placeholder="F.eks. Donatello"
            className="w-full px-3 py-2 rounded-lg border border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Temperament
          </label>
          <div className="grid gap-3 sm:grid-cols-3">
            {TEMPERAMENT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setTemperament(opt.value)}
                className={`text-left p-3 rounded-lg border-2 transition-colors ${
                  temperament === opt.value
                    ? "border-blue-500 bg-blue-50"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <span className="font-medium text-sm text-gray-900">{opt.label}</span>
                <p className="text-xs text-gray-500 mt-1">{opt.description}</p>
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Musikpræference
          </label>
          <div className="flex flex-wrap gap-2">
            {MUSIC_GENRES.map((genre) => (
              <button
                key={genre}
                onClick={() =>
                  setMusicPreference(musicPreference === genre ? "" : genre)
                }
                className={`px-3 py-1.5 rounded-full text-sm transition-colors ${
                  musicPreference === genre
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {genre}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex justify-between mt-6">
        <button
          onClick={onBack}
          className="px-4 py-2 text-gray-600 hover:text-gray-900"
        >
          Tilbage
        </button>
        <button
          onClick={onNext}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Næste: Vælg styrker
        </button>
      </div>
    </div>
  );
}
