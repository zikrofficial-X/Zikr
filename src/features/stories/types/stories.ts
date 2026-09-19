export type StoryCategory = "prophets" | "sahaba" | "documentaries" | "history";

export interface StorySourceReference {
  label: string;
  url: string;
  type: "quran" | "hadith" | "history";
}
export interface Story {
  id: string;
  slug: string;
  title: string;
  summary?: string;
  content?: string;
  category: StoryCategory;
  metadata?: Record<string, unknown>;
  primarySources?: StorySourceReference[];
  published?: boolean;
  createdAt?: string;
  updatedAt?: string;
}
