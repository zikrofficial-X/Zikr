export type KidsAudioCategory = 'story' | 'nasheed' | 'dhikr';

export type KidsAudioTrack = {
  id: string;
  title: string;
  description: string;
  category: KidsAudioCategory;
  duration: string;
  transcript: string;
  audioUrl?: string;
  ageGroup: '3-5' | '6-8' | '9-12';
};

export const KIDS_AUDIO_TRACKS: KidsAudioTrack[] = [
  {
    id: 'audio-story-kind-word',
    title: 'قصة الكلمة الطيبة',
    description: 'حكاية قصيرة عن أثر الكلام اللطيف في الصداقة.',
    category: 'story',
    duration: '2:10',
    ageGroup: '6-8',
    transcript: 'استمع إلى قصة قصيرة، ثم اختر كلمة طيبة تقولها لشخص تحبه اليوم.',
  },
  {
    id: 'audio-story-water-guardian',
    title: 'حارس قطرة الماء',
    description: 'قصة تعليمية عن الشكر والمحافظة على الماء دون إسراف.',
    category: 'story',
    duration: '2:35',
    ageGroup: '9-12',
    transcript: 'كل قطرة نعمة. فكر في طريقة آمنة تساعد بها أسرتك على حفظ الماء.',
  },
  {
    id: 'audio-nasheed-good-deeds',
    title: 'أنشودة أعمال الخير',
    description: 'أنشودة إيقاعية قصيرة تشجع على التعاون والرحمة.',
    category: 'nasheed',
    duration: '1:45',
    ageGroup: '3-5',
    transcript: 'أعمال الخير كثيرة: ابتسامة، مساعدة، شكر، ورحمة.',
  },
  {
    id: 'audio-nasheed-light-of-learning',
    title: 'أنشودة نور التعلم',
    description: 'أنشودة هادئة عن طلب العلم وحسن الخلق.',
    category: 'nasheed',
    duration: '2:00',
    ageGroup: '6-8',
    transcript: 'نتعلم، نسأل، نعمل بالخير، ونحترم من يعلمنا.',
  },
  {
    id: 'audio-dhikr-sleep',
    title: 'ذكر ما قبل النوم',
    description: 'تدريب صوتي هادئ لقراءة ذكر ما قبل النوم مع ولي الأمر.',
    category: 'dhikr',
    duration: '0:45',
    ageGroup: '3-5',
    transcript: 'باسمك اللهم أموت وأحيا.',
  },
  {
    id: 'audio-dhikr-food',
    title: 'ذكر قبل الطعام',
    description: 'تدريب قصير على التسمية وشكر النعمة.',
    category: 'dhikr',
    duration: '0:30',
    ageGroup: '3-5',
    transcript: 'بسم الله، اللهم بارك لنا فيما رزقتنا.',
  },
  {
    id: 'audio-dhikr-gratitude',
    title: 'ذكر الحمد والشكر',
    description: 'وقفة صوتية تساعد الطفل على تذكر نعم الله وشكره عليها.',
    category: 'dhikr',
    duration: '0:50',
    ageGroup: '6-8',
    transcript: 'الحمد لله على نعمه كلها، اللهم أعني على ذكرك وشكرك وحسن عبادتك.',
  },
];

export const KIDS_AUDIO_CATEGORY_LABELS: Record<KidsAudioCategory, string> = {
  story: 'قصص مسموعة',
  nasheed: 'أناشيد إسلامية',
  dhikr: 'تدريب الأذكار',
};

export type KidsAchievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  threshold: number;
  kind: 'stars' | 'audio' | 'recording' | 'activity';
};

export const KIDS_ACHIEVEMENTS: KidsAchievement[] = [
  { id: 'first-star', title: 'أول نجمة', description: 'اكسب أول نجمة من نشاط آمن.', icon: '★', threshold: 1, kind: 'stars' },
  { id: 'kind-heart', title: 'قلب رحيم', description: 'اكسب خمس نجوم من مهام القيم.', icon: '♥', threshold: 5, kind: 'stars' },
  { id: 'story-listener', title: 'مستمع الحكايات', description: 'استمع إلى ثلاث مواد صوتية.', icon: '♫', threshold: 3, kind: 'audio' },
  { id: 'dhikr-voice', title: 'صوت الذاكر', description: 'سجّل قراءة ذكر مرة واحدة على جهازك.', icon: '◉', threshold: 1, kind: 'recording' },
  { id: 'adventure-finished', title: 'بطل المغامرة', description: 'أكمل ثماني مهام قيم.', icon: '◆', threshold: 8, kind: 'activity' },
  { id: 'bright-path', title: 'طريق مشرق', description: 'اجمع عشرين نجمة من الأنشطة المختلفة.', icon: '✦', threshold: 20, kind: 'stars' },
];

export const KIDS_ACHIEVEMENT_STORAGE_KEY = 'zikr-kids-achievements-v1';

export type KidsProgress = {
  stars: number;
  listenedTrackIds: string[];
  recordingCount: number;
  completedActivities: number;
};

export const EMPTY_KIDS_PROGRESS: KidsProgress = {
  stars: 0,
  listenedTrackIds: [],
  recordingCount: 0,
  completedActivities: 0,
};

export function normalizeKidsProgress(value: unknown): KidsProgress {
  if (!value || typeof value !== 'object') return { ...EMPTY_KIDS_PROGRESS };
  const candidate = value as Partial<KidsProgress>;
  return {
    stars: typeof candidate.stars === 'number' && Number.isFinite(candidate.stars) ? Math.max(0, Math.floor(candidate.stars)) : 0,
    listenedTrackIds: Array.isArray(candidate.listenedTrackIds) ? candidate.listenedTrackIds.filter((id): id is string => typeof id === 'string').slice(0, 100) : [],
    recordingCount: typeof candidate.recordingCount === 'number' && Number.isFinite(candidate.recordingCount) ? Math.max(0, Math.floor(candidate.recordingCount)) : 0,
    completedActivities: typeof candidate.completedActivities === 'number' && Number.isFinite(candidate.completedActivities) ? Math.max(0, Math.floor(candidate.completedActivities)) : 0,
  };
}

export function getEarnedKidsAchievements(progress: KidsProgress): KidsAchievement[] {
  return KIDS_ACHIEVEMENTS.filter(achievement => {
    if (achievement.kind === 'stars') return progress.stars >= achievement.threshold;
    if (achievement.kind === 'audio') return progress.listenedTrackIds.length >= achievement.threshold;
    if (achievement.kind === 'recording') return progress.recordingCount >= achievement.threshold;
    return progress.completedActivities >= achievement.threshold;
  });
}
