export interface RadioChannel { id: string; name: string; streamUrl: string; category: 'quran' | 'tawasheeh'; }
export interface Nasheed { id: string; title: string; artist: string; audioUrl: string; }
export interface AudioPlaylist { id: string; title: string; items: Array<RadioChannel | Nasheed>; }

export async function getRadioChannels(): Promise<RadioChannel[]> {
  return [
    { id: 'quran-sa', name: 'Quran Radio KSA', streamUrl: 'https://stream.radiojar.com/8s5u5tpdtwzuv', category: 'quran' },
    { id: 'tawasheeh-1', name: 'Tawasheeh - Maher Al Muaiqly', streamUrl: 'https://qurango.net/radio/maher_al_muaiqly', category: 'tawasheeh' },
    { id: 'tawasheeh-2', name: 'Tawasheeh - Mishary Al Afasy', streamUrl: 'https://qurango.net/radio/mishary_alafasy', category: 'tawasheeh' },
    { id: 'tawasheeh-3', name: 'Tawasheeh - Abdul Basit', streamUrl: 'https://qurango.net/radio/abdulbasit', category: 'tawasheeh' },
  ];
}

export async function getNasheeds(): Promise<Nasheed[]> {
  return [
    { id: 'n1', title: 'Tala al Badru', artist: 'Traditional', audioUrl: 'https://qurango.net/nasheed/tala-al-badru' },
    { id: 'n2', title: 'Ya Noor Al Ain', artist: 'Maher Zain', audioUrl: 'https://qurango.net/nasheed/ya-noor-al-ain' },
    { id: 'n3', title: 'Inshallah', artist: 'Maher Zain', audioUrl: 'https://qurango.net/nasheed/inshallah' },
    { id: 'n4', title: 'Baraka Allahu Feek', artist: 'Maher Zain', audioUrl: 'https://qurango.net/nasheed/baraka-allahu-feek' },
  ];
}

export async function getAudioPlaylists(): Promise<AudioPlaylist[]> {
  const [channels, nasheeds] = await Promise.all([getRadioChannels(), getNasheeds()]);
  return [{ id: 'featured', title: 'Featured Islamic Audio', items: [...channels, ...nasheeds] }];
}

// Future audio support:
// - Add reciter-based Quran playlists and offline caching metadata.
// - Implement user-created playlists and favorites.
