import { createHash } from "node:crypto";

export function videoContentHash(input: { category: string; sourceId?: string; text: string; format: string; templateVersion: string; language: string; style?: string }) {
  const canonical = [input.category, input.sourceId ?? "", input.text.trim(), input.format, input.templateVersion, input.language, input.style ?? ""].join("\u001f");
  return createHash("sha256").update(canonical, "utf8").digest("hex");
}

export function sourceHash(input: { sourceId?: string; sourceUrl?: string; text: string }) {
  return createHash("sha256").update([input.sourceId ?? "", input.sourceUrl ?? "", input.text.trim()].join("\u001f"), "utf8").digest("hex");
}
