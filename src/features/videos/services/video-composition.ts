export type VideoCompositionKey = "quran" | "hadith" | "dua" | "adhkar" | "story" | "kids" | "editorial";
export type VideoCameraPath = "center" | "left-to-right" | "right-to-left" | "top-to-bottom" | "bottom-to-top";

type CompositionPreset = {
  key: VideoCompositionKey;
  accentHex: string;
  accentAss: string;
  panelHex: string;
  panelOpacity: number;
  panelX: number;
  panelY: number;
  panelWidth: number;
  panelHeight: number;
  lineCharsVertical: number;
  lineCharsHorizontal: number;
  linesPerPageVertical: number;
  linesPerPageHorizontal: number;
  titleSizeVertical: number;
  titleSizeHorizontal: number;
  bodySizeVertical: number;
  bodySizeHorizontal: number;
  bodyY: number;
  contrast: number;
  saturation: number;
};

export type VideoCompositionProfile = CompositionPreset & {
  width: number;
  height: number;
  isVertical: boolean;
  panelLeft: number;
  panelTop: number;
  panelPixelWidth: number;
  panelPixelHeight: number;
  bodyX: number;
  bodyAnchorY: number;
  titleY: number;
  accentThickness: number;
  lineChars: number;
  linesPerPage: number;
  titleFontSize: number;
  bodyFontSize: number;
  cameraPath: VideoCameraPath;
  zoomIncrement: number;
};

const PRESETS: Record<VideoCompositionKey, CompositionPreset> = {
  quran: {
    key: "quran",
    accentHex: "EFD39A",
    accentAss: "&H009AD3EF",
    panelHex: "06130F",
    panelOpacity: 0.62,
    panelX: 0.095, panelY: 0.295, panelWidth: 0.81, panelHeight: 0.43,
    lineCharsVertical: 26, lineCharsHorizontal: 48,
    linesPerPageVertical: 3, linesPerPageHorizontal: 2,
    titleSizeVertical: 48, titleSizeHorizontal: 39,
    bodySizeVertical: 64, bodySizeHorizontal: 50,
    bodyY: 0.515, contrast: 1.10, saturation: 1.04,
  },
  hadith: {
    key: "hadith",
    accentHex: "D8C8A6",
    accentAss: "&H00A6C8D8",
    panelHex: "0C1421",
    panelOpacity: 0.66,
    panelX: 0.08, panelY: 0.32, panelWidth: 0.84, panelHeight: 0.39,
    lineCharsVertical: 31, lineCharsHorizontal: 56,
    linesPerPageVertical: 3, linesPerPageHorizontal: 2,
    titleSizeVertical: 45, titleSizeHorizontal: 37,
    bodySizeVertical: 54, bodySizeHorizontal: 45,
    bodyY: 0.515, contrast: 1.12, saturation: 0.96,
  },
  dua: {
    key: "dua",
    accentHex: "F2B9CC",
    accentAss: "&H00CCB9F2",
    panelHex: "1A101C",
    panelOpacity: 0.63,
    panelX: 0.09, panelY: 0.285, panelWidth: 0.82, panelHeight: 0.455,
    lineCharsVertical: 28, lineCharsHorizontal: 51,
    linesPerPageVertical: 3, linesPerPageHorizontal: 2,
    titleSizeVertical: 47, titleSizeHorizontal: 39,
    bodySizeVertical: 59, bodySizeHorizontal: 48,
    bodyY: 0.515, contrast: 1.08, saturation: 1.06,
  },
  adhkar: {
    key: "adhkar",
    accentHex: "B8E7C6",
    accentAss: "&H00C6E7B8",
    panelHex: "071A18",
    panelOpacity: 0.60,
    panelX: 0.08, panelY: 0.335, panelWidth: 0.84, panelHeight: 0.36,
    lineCharsVertical: 30, lineCharsHorizontal: 54,
    linesPerPageVertical: 3, linesPerPageHorizontal: 2,
    titleSizeVertical: 45, titleSizeHorizontal: 37,
    bodySizeVertical: 58, bodySizeHorizontal: 47,
    bodyY: 0.515, contrast: 1.10, saturation: 1.08,
  },
  story: {
    key: "story",
    accentHex: "F0C98B",
    accentAss: "&H008BC9F0",
    panelHex: "0D101A",
    panelOpacity: 0.69,
    panelX: 0.075, panelY: 0.345, panelWidth: 0.85, panelHeight: 0.415,
    lineCharsVertical: 32, lineCharsHorizontal: 58,
    linesPerPageVertical: 3, linesPerPageHorizontal: 2,
    titleSizeVertical: 46, titleSizeHorizontal: 38,
    bodySizeVertical: 53, bodySizeHorizontal: 44,
    bodyY: 0.545, contrast: 1.13, saturation: 1.03,
  },
  kids: {
    key: "kids",
    accentHex: "A9E6D0",
    accentAss: "&H00D0E6A9",
    panelHex: "071D2A",
    panelOpacity: 0.66,
    panelX: 0.07, panelY: 0.315, panelWidth: 0.86, panelHeight: 0.405,
    lineCharsVertical: 31, lineCharsHorizontal: 56,
    linesPerPageVertical: 3, linesPerPageHorizontal: 2,
    titleSizeVertical: 44, titleSizeHorizontal: 36,
    bodySizeVertical: 50, bodySizeHorizontal: 42,
    bodyY: 0.515, contrast: 1.09, saturation: 1.08,
  },
  editorial: {
    key: "editorial",
    accentHex: "E8D8B4",
    accentAss: "&H00B4D8E8",
    panelHex: "081411",
    panelOpacity: 0.64,
    panelX: 0.085, panelY: 0.32, panelWidth: 0.83, panelHeight: 0.40,
    lineCharsVertical: 30, lineCharsHorizontal: 55,
    linesPerPageVertical: 3, linesPerPageHorizontal: 2,
    titleSizeVertical: 46, titleSizeHorizontal: 38,
    bodySizeVertical: 55, bodySizeHorizontal: 46,
    bodyY: 0.52, contrast: 1.10, saturation: 1.02,
  },
};

function stableIndex(seed: string, length: number): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) % Math.max(1, length);
}

function compositionKey(category: string, audience: unknown): VideoCompositionKey {
  if (audience === "kids") return "kids";
  const normalized = category.trim().toLowerCase();
  if (normalized === "quran") return "quran";
  if (normalized === "hadith") return "hadith";
  if (normalized === "dua") return "dua";
  if (normalized === "adhkar") return "adhkar";
  if (normalized === "story" || normalized === "stories") return "story";
  return "editorial";
}

export function resolveVideoComposition(input: {
  category: string;
  audience?: unknown;
  seed: string;
  width: number;
  height: number;
}): VideoCompositionProfile {
  const isVertical = input.height >= input.width;
  const width = Math.max(1, Math.floor(input.width));
  const height = Math.max(1, Math.floor(input.height));
  const preset = PRESETS[compositionKey(input.category, input.audience)];
  const cameraPaths: VideoCameraPath[] = [
    "center",
    "left-to-right",
    "right-to-left",
    "top-to-bottom",
    "bottom-to-top",
  ];
  const cameraPath = cameraPaths[stableIndex(input.seed, cameraPaths.length)];
  return {
    ...preset,
    width,
    height,
    isVertical,
    panelLeft: Math.round(width * preset.panelX),
    panelTop: Math.round(height * preset.panelY),
    panelPixelWidth: Math.round(width * preset.panelWidth),
    panelPixelHeight: Math.round(height * preset.panelHeight),
    bodyX: Math.round(width / 2),
    bodyAnchorY: Math.round(height * preset.bodyY),
    titleY: Math.round(height * 0.185),
    accentThickness: Math.max(5, Math.round(height * 0.004)),
    lineChars: isVertical ? preset.lineCharsVertical : preset.lineCharsHorizontal,
    linesPerPage: isVertical ? preset.linesPerPageVertical : preset.linesPerPageHorizontal,
    titleFontSize: isVertical ? preset.titleSizeVertical : preset.titleSizeHorizontal,
    bodyFontSize: isVertical ? preset.bodySizeVertical : preset.bodySizeHorizontal,
    cameraPath,
    zoomIncrement: cameraPath === "center" ? 0.00016 : 0.0002,
  };
}

export type CaptionTiming = { start: number; end: number; text: string };

function captionWeight(page: string): number {
  const plain = page.replace(/\\N/g, " ").trim();
  const words = plain.match(/[\p{L}\p{N}]+/gu)?.length ?? 0;
  const pauses = plain.match(/[،؛؟!.:]/gu)?.length ?? 0;
  return Math.max(1, words + pauses * 0.45);
}

/**
 * Estimates page-level caption cues from spoken text length and punctuation.
 * This is a duration-aware pacing fallback, not forced word-level alignment.
 */
export function planCaptionTimings(
  pages: string[],
  audioDuration: number,
  options: { leadInSeconds?: number; tailSeconds?: number; minimumPageSeconds?: number } = {},
): CaptionTiming[] {
  if (!pages.length) return [];
  const safeDuration = Number.isFinite(audioDuration) ? Math.max(0, audioDuration) : 0;
  const leadIn = Math.min(Math.max(0, options.leadInSeconds ?? 0.25), safeDuration * 0.08);
  const tail = Math.min(Math.max(0, options.tailSeconds ?? 0.4), safeDuration * 0.12);
  const start = Math.min(leadIn, safeDuration * 0.1);
  const end = Math.max(start + 0.05, safeDuration - tail);
  const available = Math.max(0.05, end - start);
  const minimumPageSeconds = Math.max(0, options.minimumPageSeconds ?? 1.35);
  const weights = pages.map(captionWeight);
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const useMinimum = available >= minimumPageSeconds * pages.length;
  const distributable = useMinimum ? available - minimumPageSeconds * pages.length : available;
  let cursor = start;
  return pages.map((page, index) => {
    const base = useMinimum ? minimumPageSeconds : 0;
    const share = distributable * (weights[index] / totalWeight);
    const pageStart = cursor;
    const pageEnd = index === pages.length - 1 ? end : Math.min(end, cursor + base + share);
    cursor = pageEnd;
    return { start: pageStart, end: pageEnd, text: page };
  });
}
