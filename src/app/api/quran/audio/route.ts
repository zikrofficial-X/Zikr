import { NextResponse } from 'next/server';
import { isSupabaseConfigured, supabaseServerAnonRequest } from '@/lib/supabase/server';

type ReciterRow = { id: string; code: string };
type AudioRow = {
  audio_url: string;
  source_url: string | null;
  retrieved_at: string | null;
};

const VERIFIED_SURAH_AUDIO_BASES: Record<string, string> = {
  // Canonical database codes
  afs: "https://server8.mp3quran.net/afs",
  minsh: "https://server10.mp3quran.net/minsh",
  basit: "https://server7.mp3quran.net/basit",
  sds: "https://server11.mp3quran.net/sds",
  shur: "https://server7.mp3quran.net/shur",
  maher: "https://server12.mp3quran.net/maher",
  s_gmd: "https://server7.mp3quran.net/s_gmd",

  // Legacy / human-readable aliases
  alafasy: "https://server8.mp3quran.net/afs",
  minshawi: "https://server10.mp3quran.net/minsh",
  abdulbasit: "https://server7.mp3quran.net/basit",
  abdulsamad: "https://server7.mp3quran.net/basit",
  sudais: "https://server11.mp3quran.net/sds",
  "as-sudais": "https://server11.mp3quran.net/sds",
  shuraim: "https://server7.mp3quran.net/shur",
  shuraym: "https://server7.mp3quran.net/shur",
  mahermuaiqly: "https://server12.mp3quran.net/maher",
  ghamdi: "https://server7.mp3quran.net/s_gmd",
  saadghamidi: "https://server7.mp3quran.net/s_gmd",

  // Extended MP3Quran reciters (full 114-surah mushaf)
  "akdr": "https://server6.mp3quran.net/akdr",
  "akrm": "https://server9.mp3quran.net/akrm",
  "tblawi-al-mojawwad": "https://server12.mp3quran.net/tblawi/Al-Mojawwad",
  "lhdan": "https://server8.mp3quran.net/lhdan",
  "mhsny": "https://server11.mp3quran.net/mhsny",
  "ayyoub2-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/ayyoub2/Rewayat-Hafs-A-n-Assem",
  "shah": "https://server12.mp3quran.net/shah",
  "jbrl": "https://server8.mp3quran.net/jbrl",
  "m-krm-rewayat-warsh-a-n-nafi-men-tariq-abi-baker-alasbahani": "https://server12.mp3quran.net/m_krm/Rewayat-Warsh-A-n-Nafi-Men-Tariq-Abi-Baker-Alasbahani",
  "abdullah-rewayat-aldorai-a-n-al-kisa-ai": "https://server9.mp3quran.net/abdullah/Rewayat-AlDorai-A-n-Al-Kisa-ai",
  "husr-rewayat-qalon-a-n-nafi": "https://server13.mp3quran.net/husr/Rewayat-Qalon-A-n-Nafi",
  "abkr": "https://server6.mp3quran.net/abkr",
  "bna-almusshaf-al-mojawwad": "https://server8.mp3quran.net/bna/Almusshaf-Al-Mojawwad",
  "mustafa-almusshaf-al-mojawwad": "https://server8.mp3quran.net/mustafa/Almusshaf-Al-Mojawwad",
  "lahoni": "https://server6.mp3quran.net/lahoni",
  "ra3ad": "https://server8.mp3quran.net/ra3ad",
  "muftah-sultany-rewayat-ibn-thakwan-a-n-ibn-amer": "https://server14.mp3quran.net/muftah_sultany/Rewayat_Ibn-Thakwan-A-n-Ibn-Amer",
  "alzain": "https://server9.mp3quran.net/alzain",
  "m-sayed-rewayat-warsh-a-n-nafi": "https://server16.mp3quran.net/m_sayed/Rewayat-Warsh-A-n-Nafi",
  "a-binaoun-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/a_binaoun/Rewayat-Hafs-A-n-Assem",
  "nourin-siddig-rewayat-aldori-a-n-abi-amr": "https://server16.mp3quran.net/nourin_siddig/Rewayat-Aldori-A-n-Abi-Amr",
  "zaml": "https://server9.mp3quran.net/zaml",
  "qari": "https://server11.mp3quran.net/qari",
  "shaksh": "https://server10.mp3quran.net/shaksh",
  "sheimy": "https://server10.mp3quran.net/sheimy",
  "salamah-rewayat-hafs-a-n-assem": "https://server12.mp3quran.net/salamah/Rewayat-Hafs-A-n-Assem",
  "mohna": "https://server11.mp3quran.net/mohna",
  "koshi": "https://server11.mp3quran.net/koshi",
  "a-klb": "https://server8.mp3quran.net/a_klb",
  "bilal": "https://server11.mp3quran.net/bilal",
  "hatem": "https://server11.mp3quran.net/hatem",
  "jormy": "https://server11.mp3quran.net/jormy",
  "mrifai": "https://server11.mp3quran.net/mrifai",
  "twfeeq": "https://server6.mp3quran.net/twfeeq",
  "ibrahim-dosri-rewayat-hafs-a-n-assem": "https://server10.mp3quran.net/ibrahim_dosri/Rewayat-Hafs-A-n-Assem",
  "jamal": "https://server6.mp3quran.net/jamal",
  "jaman": "https://server6.mp3quran.net/jaman",
  "noah": "https://server8.mp3quran.net/noah",
  "harthi": "https://server8.mp3quran.net/harthi",
  "rashad": "https://server10.mp3quran.net/rashad",
  "jleel": "https://server10.mp3quran.net/jleel",
  "trabulsi": "https://server10.mp3quran.net/trabulsi",
  "abdullahk": "https://server10.mp3quran.net/Abdullahk",
  "aamer": "https://server10.mp3quran.net/Aamer",
  "khan": "https://server6.mp3quran.net/khan",
  "dokali": "https://server7.mp3quran.net/dokali",
  "qht": "https://server10.mp3quran.net/qht",
  "fateh": "https://server6.mp3quran.net/fateh",
  "a-alqrafi-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/a_alqrafi/Rewayat-Hafs-A-n-Assem",
  "a-ghailan-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/A-Ghailan/Rewayat-Hafs-A-n-Assem",
  "m-burhaji-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/M_Burhaji/Rewayat-Hafs-A-n-Assem",
  "y-alaidroos-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/Y_ALaidroos/Rewayat-Hafs-A-n-Assem",
  "h-aldaghriri-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/H-Aldaghriri/Rewayat-Hafs-A-n-Assem",
  "m-alfaqih-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/M_Alfaqih/Rewayat-Hafs-A-n-Assem",
  "j-abdullah-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/J-Abdullah/Rewayat-Hafs-A-n-Assem",
  "k-alzadi-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/K-Alzadi/Rewayat-Hafs-A-n-Assem",
  "a-albadr-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/A-AlBadr/Rewayat-Hafs-A-n-Assem",
  "alijon-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/Alijon/Rewayat-Hafs-A-n-Assem",
  "m-alzubaidi-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/M-AlZubaidi/Rewayat-Hafs-A-n-Assem",
  "a-benkirane-rewayat-warsh-a-n-nafi": "https://server16.mp3quran.net/A-Benkirane/Rewayat-Warsh-A-n-Nafi",
  "tareq": "https://server10.mp3quran.net/tareq",
  "asim-rewayat-hafs-a-n-assem": "https://server7.mp3quran.net/asim/Rewayat-Hafs-A-n-Assem",
  "m-harfoush-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/M-Harfoush/Rewayat-Hafs-A-n-Assem",
  "balilah": "https://server6.mp3quran.net/balilah",
  "wdee3": "https://server6.mp3quran.net/wdee3",
  "kafi": "https://server11.mp3quran.net/kafi",
  "kurdi": "https://server6.mp3quran.net/kurdi",
  "aloosi": "https://server6.mp3quran.net/aloosi",
  "m-qari": "https://server8.mp3quran.net/m_qari",
  "rami": "https://server6.mp3quran.net/rami",
  "a-majed": "https://server10.mp3quran.net/a_majed",
  "m-akri-rewayat-qalon-a-n-nafi": "https://server16.mp3quran.net/m_akri/Rewayat-Qalon-A-n-Nafi",
  "tnjy": "https://server12.mp3quran.net/tnjy",
  "mousa-rewayat-hafs-a-n-assem": "https://server14.mp3quran.net/mousa/Rewayat-Hafs-A-n-Assem",
  "khalf": "https://server14.mp3quran.net/khalf",
  "mansor": "https://server14.mp3quran.net/mansor",
  "alosfor": "https://server14.mp3quran.net/alosfor",
  "hamza": "https://server9.mp3quran.net/hamza",
  "bukheet": "https://server14.mp3quran.net/bukheet",
  "nasser-almajed": "https://server14.mp3quran.net/nasser_almajed",
  "swlim-rewayat-hafs-a-n-assem": "https://server14.mp3quran.net/swlim/Rewayat-Hafs-A-n-Assem",
  "bader-rewayat-hafs-a-n-assem": "https://server10.mp3quran.net/bader/Rewayat-Hafs-A-n-Assem",
  "shaheen-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/shaheen/Rewayat-Hafs-A-n-Assem",
  "saad-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/saad/Rewayat-Hafs-A-n-Assem",
  "nufais-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/nufais/Rewayat-Hafs-A-n-Assem",
  "darweez-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/darweez/Rewayat-Hafs-A-n-Assem",
  "deban-rewayat-warsh-a-n-nafi-men-tariq-alazraq": "https://server16.mp3quran.net/deban/Rewayat-Warsh-A-n-Nafi-Men-Tariq-Alazraq",
  "kamel-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/kamel/Rewayat-Hafs-A-n-Assem",
  "peshawa-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/peshawa/Rewayat-Hafs-A-n-Assem",
  "bl3-rewayat-warsh-a-n-nafi": "https://server6.mp3quran.net/bl3/Rewayat-Warsh-A-n-Nafi",
  "nathier-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/nathier/Rewayat-Hafs-A-n-Assem",
  "okasha-rewayat-albizi-a-n-ibn-katheer": "https://server16.mp3quran.net/okasha/Rewayat-Albizi-A-n-Ibn-Katheer",
  "h-dukhain-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/h_dukhain/Rewayat-Hafs-A-n-Assem",
  "sneineh-rewayat-qalon-a-n-nafi": "https://server16.mp3quran.net/sneineh/Rewayat-Qalon-A-n-Nafi",
  "qeniwa-rewayat-qalon-a-n-nafi": "https://server16.mp3quran.net/qeniwa/Rewayat-Qalon-A-n-Nafi",
  "m-abdelhakam-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/m_abdelhakam/Rewayat-Hafs-A-n-Assem",
  "a-maasaraawi-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/a_maasaraawi/Rewayat-Hafs-A-n-Assem",
  "i-kshidan-rewayat-qalon-a-n-nafi": "https://server16.mp3quran.net/i_kshidan/Rewayat-Qalon-A-n-Nafi",
  "h-abudalal-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/h_abudalal/Rewayat-Hafs-A-n-Assem",
  "f-khamery-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/f_khamery/Rewayat-Hafs-A-n-Assem",
  "s-hashemi-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/s_hashemi/Rewayat-Hafs-A-n-Assem",
  "kh-mohammadi-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/kh_mohammadi/Rewayat-Hafs-A-n-Assem",
  "mal-allah-jaber-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/mal-allah_jaber/Rewayat-Hafs-A-n-Assem",
  "s-sadeiq-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/s_sadeiq/Rewayat-Hafs-A-n-Assem",
  "h-saleh-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/h_saleh/Rewayat-Hafs-A-n-Assem",
  "a-alshahhat-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/a_alshahhat/Rewayat-Hafs-A-n-Assem",
  "i-sanankoua-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/i_sanankoua/Rewayat-Hafs-A-n-Assem",
  "s-alquraishi-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/s_alquraishi/Rewayat-Hafs-A-n-Assem",
  "3siri": "https://server6.mp3quran.net/3siri",
  "shamrani-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/shamrani/Rewayat-Hafs-A-n-Assem",
  "f-hajry-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/f_hajry/Rewayat-Hafs-A-n-Assem",
  "a-alemadi-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/a_alemadi/Rewayat-Hafs-A-n-Assem",
  "a-alhazmi-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/a_alhazmi/Rewayat-Hafs-A-n-Assem",
  "shl": "https://server6.mp3quran.net/shl",
  "zaki": "https://server9.mp3quran.net/zaki",
  "sayed": "https://server12.mp3quran.net/sayed",
  "taher": "https://server12.mp3quran.net/taher",
  "hkm": "https://server12.mp3quran.net/hkm",
  "shatri": "https://server11.mp3quran.net/shatri",
  "sahood": "https://server8.mp3quran.net/sahood",
  "habdan": "https://server6.mp3quran.net/habdan",
  "s-bud": "https://server6.mp3quran.net/s_bud",
  "salah-hashim-m": "https://server12.mp3quran.net/salah_hashim_m",
  "bu-khtr": "https://server8.mp3quran.net/bu_khtr",
  "mukhtar-haj-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/mukhtar_haj/Rewayat-Hafs-A-n-Assem",
  "ryan": "https://server8.mp3quran.net/ryan",
  "thubti": "https://server6.mp3quran.net/thubti",
  "ajm": "https://server10.mp3quran.net/ajm",
  "bari": "https://server12.mp3quran.net/bari",
  "a-ahmed": "https://server11.mp3quran.net/a_ahmed",
  "zahrani": "https://server9.mp3quran.net/zahrani",
  "buajan": "https://server8.mp3quran.net/buajan",
  "mtrod": "https://server8.mp3quran.net/mtrod",
  "hawashi": "https://server11.mp3quran.net/hawashi",
  "bsfr": "https://server6.mp3quran.net/bsfr",
  "kyat": "https://server12.mp3quran.net/kyat",
  "jhn": "https://server13.mp3quran.net/jhn",
  "gulan": "https://server8.mp3quran.net/gulan",
  "soufi-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/soufi/Rewayat-Hafs-A-n-Assem",
  "mohsin-harthi": "https://server6.mp3quran.net/mohsin_harthi",
  "qasm": "https://server8.mp3quran.net/qasm",
  "obk": "https://server12.mp3quran.net/obk",
  "kanakeri": "https://server6.mp3quran.net/kanakeri",
  "wdod": "https://server8.mp3quran.net/wdod",
  "arkani": "https://server6.mp3quran.net/arkani",
  "hthfi-rewayat-sho-bah-a-n-asim": "https://server9.mp3quran.net/hthfi/Rewayat-Sho-bah-A-n-Asim",
  "a-jbr": "https://server11.mp3quran.net/a_jbr",
  "hajjaj": "https://server9.mp3quran.net/hajjaj",
  "hafz": "https://server6.mp3quran.net/hafz",
  "a-turki-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/a_turki/Rewayat-Hafs-A-n-Assem",
  "saber": "https://server8.mp3quran.net/saber",
  "omar-warsh": "https://server9.mp3quran.net/omar_warsh",
  "frs-a": "https://server8.mp3quran.net/frs_a",
  "qtm": "https://server6.mp3quran.net/qtm",
  "nabil": "https://server9.mp3quran.net/nabil",
  "namh": "https://server8.mp3quran.net/namh",
  "hani": "https://server8.mp3quran.net/hani",
  "ahmad-nu": "https://server11.mp3quran.net/ahmad_nu",
  "waleed": "https://server9.mp3quran.net/waleed",
  "yasser": "https://server11.mp3quran.net/yasser",
  "qurashi": "https://server9.mp3quran.net/qurashi",
  "mzroyee": "https://server9.mp3quran.net/mzroyee",
  "yahya": "https://server12.mp3quran.net/yahya",
  "yousef": "https://server9.mp3quran.net/yousef",
  "a-abdl-rewayat-hafs-a-n-assem": "https://server16.mp3quran.net/a_abdl/Rewayat-Hafs-A-n-Assem",
};

function normalizeReciterCode(code: string): string {
  return code.replace(/^ar\./i, '').trim().toLowerCase();
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: {
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=604800',
    },
  });
}
function buildVerifiedAudio(code: string, surah: number) {
  const baseUrl = VERIFIED_SURAH_AUDIO_BASES[code];
  if (!baseUrl) return null;
  return {
    audio_url: baseUrl + "/" + String(surah).padStart(3, "0") + ".mp3",
    source_url: "https://www.mp3quran.net/",
    retrieved_at: null,
  };
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const surah = Number.parseInt(url.searchParams.get('surah') ?? '', 10);
  const reciter = (url.searchParams.get('reciter') ?? '').trim();

  if (!Number.isInteger(surah) || surah < 1 || surah > 114) {
    return json({ error: 'Invalid surah' }, 400);
  }
  if (!/^[a-z0-9.-]{2,80}$/i.test(reciter)) {
    return json({ error: 'Invalid reciter' }, 400);
  }
  const normalizedCode = normalizeReciterCode(reciter);
  const verifiedFallback = () => buildVerifiedAudio(normalizedCode, surah);

  // Always keep a verified source available even when Supabase public
  // credentials are unavailable in a deployment.
  if (!isSupabaseConfigured()) {
    return json({ audio: verifiedFallback() });
  }

  try {
    const candidates = [...new Set([reciter, `ar.${normalizedCode}`, normalizedCode])].filter(Boolean);
    let reciterId: string | null = null;

    for (const candidate of candidates) {
      const reciters = await supabaseServerAnonRequest<ReciterRow[]>(
        `/rest/v1/quran_reciters?code=eq.${encodeURIComponent(candidate)}&select=id,code&limit=1`,
      );
      if (reciters?.[0]?.id) {
        reciterId = reciters[0].id;
        break;
      }
    }

    if (reciterId) {
      const rows = await supabaseServerAnonRequest<AudioRow[]>(
        `/rest/v1/quran_audio?surah_id=eq.${surah}&reciter_id=eq.${encodeURIComponent(reciterId)}&select=audio_url,source_url,retrieved_at&limit=1`,
      );
      if (rows?.[0]?.audio_url) return json({ audio: rows[0] });
    }

    // Keep playback available even when an individual DB row is temporarily
    // missing. These templates are the same verified MP3Quran sources used by
    // the restored quran_audio dataset.
    return json({ audio: verifiedFallback() });
  } catch (error) {
    console.warn('[api/quran/audio] unavailable:', error instanceof Error ? error.message : error);
    return json({ audio: null });
  }
}
