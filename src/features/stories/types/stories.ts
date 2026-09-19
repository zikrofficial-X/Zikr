export type StoryCategory = "prophets" | "sahaba" | "documentaries" | "history";

export interface StorySourceReference {
  label: string;
  url: string;
  type: "quran" | "hadith" | "history";
}
