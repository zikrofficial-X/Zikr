import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { buildAuthProfileSyncPayload } from "../../src/features/profile/services/profile-sync";
import { normalizeIanaTimeZone } from "../../src/lib/timezone";

test("auth sync preserves user-edited profile name and avatar", () => {
  const payload = buildAuthProfileSyncPayload(
    {
      id: "user-1",
      email: "user@example.com",
      user_metadata: {
        full_name: "Provider Name",
        avatar_url: "https://provider.example/avatar.png",
      },
    },
    {
      display_name: "Custom Profile Name",
      avatar_url: "https://cdn.example/custom-avatar.png",
    },
    "2026-11-11T02:30:00.000Z",
  );

  assert.deepEqual(payload, {
    id: "user-1",
    email: "user@example.com",
    updated_at: "2026-11-11T02:30:00.000Z",
  });
});

test("auth sync bootstraps blank profile fields from provider metadata", () => {
  const payload = buildAuthProfileSyncPayload(
    {
      id: "user-2",
      email: "new.user@example.com",
      user_metadata: {
        full_name: "New User",
        picture: "https://provider.example/new-user.png",
      },
    },
    { display_name: " ", avatar_url: null },
    "2026-11-11T02:30:00.000Z",
  );

  assert.deepEqual(payload, {
    id: "user-2",
    email: "new.user@example.com",
    display_name: "New User",
    avatar_url: "https://provider.example/new-user.png",
    updated_at: "2026-11-11T02:30:00.000Z",
  });
});

test("auth sync does not clear custom values when provider metadata is absent", () => {
  const payload = buildAuthProfileSyncPayload(
    { id: "user-3", email: null, user_metadata: {} },
    { display_name: "Saved Name", avatar_url: "https://cdn.example/saved.png" },
    "2026-11-11T02:30:00.000Z",
  );

  assert.deepEqual(payload, {
    id: "user-3",
    updated_at: "2026-11-11T02:30:00.000Z",
  });
});

test("auth sync uses a safe email-local-part fallback only for a new profile", () => {
  const payload = buildAuthProfileSyncPayload(
    { id: "user-4", email: "mohamed@example.com", user_metadata: {} },
    null,
    "2026-11-11T02:30:00.000Z",
  );

  assert.equal(payload.display_name, "mohamed");
});

test("profile timezone updates reject invalid IANA timezone values", () => {
  assert.equal(normalizeIanaTimeZone("America/New_York"), "America/New_York");
  assert.equal(normalizeIanaTimeZone("Africa/Cairo"), "Africa/Cairo");
  assert.equal(normalizeIanaTimeZone("Invalid/Timezone"), null);
  assert.equal(normalizeIanaTimeZone(""), null);

  const profileService = readFileSync(
    "src/features/profile/services/profile.ts",
    "utf8",
  );
  assert.match(profileService, /normalizeIanaTimeZone\(candidate\)/);
  assert.match(profileService, /timezone must be a valid IANA timezone/);
});
