export type Competition = {
  id: string;
  title: string;
  description: string | null;
  prize: string | null;
  starts_at: string | null;
  ends_at: string | null;
  metadata: { imageUrl?: string | null; rules?: string | null } | null;
};
