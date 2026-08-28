# ZIKR API Documentation

Complete API reference for the ZIKR Islamic platform.

## Endpoint Overview Table

| Method | Endpoint | Description | Auth Required | Tags |
|--------|----------|-------------|---------------|------|
| POST | `/api/poetry-insight` | Generate AI literary analysis of a poem | None | AI, Poetry |
| POST | `/auth/login` (Server Action) | Login with email/password | None | Auth |
| POST | `/auth/register` (Server Action) | Register new account | None | Auth |
| POST | `/auth/forgot` (Server Action) | Send password reset email | None | Auth |
| POST | `/auth/logout` (Server Action) | Clear session cookies | None | Auth |
| POST | `/auth/set-session` (Server Action) | Set session from OAuth callback | None | Auth |
| PATCH | `/auth/profile` (Server Action) | Update user profile | Required | Auth |
| POST | `/admin/site-setting` (Server Action) | Save site settings | Admin | Admin |
| POST | `/admin/story` (Server Action) | Create/update a story | Admin | Admin |
| POST | `/admin/competition` (Server Action) | Create a competition | Admin | Admin |
| POST | `/admin/pinned-message` (Server Action) | Create a pinned message | Admin | Admin |
| POST | `/admin/memorization-plan` (Server Action) | Create a memorization plan | Admin | Admin |
| POST | `/favorites/add` (Server Action) | Add item to favorites | Required | Favorites |
| DELETE | `/favorites/remove` (Server Action) | Remove item from favorites | Required | Favorites |
| GET | `/favorites/check` (Server Action) | Check if item is favorited | Required | Favorites |
| POST | `/memorization/evaluate` (Server Action) | Evaluate Quran recitation via AI | None | AI, Memorization |
| POST | `/spiritual-ai/search` (Server Action) | Search spiritual content by feeling | None | AI, Spiritual |

---

## Authentication & Authorization

### Authentication Method

ZIKR uses **Supabase JWT authentication** with HTTP-only cookies for session management.

- **Token type:** Supabase JWT access token
- **Storage:** HTTP-only cookies (`sb_access_token`, `sb_refresh_token`)
- **Transport:** Cookies (not Bearer header) for server actions; Bearer header for direct API calls

### How to Obtain a Token

1. **Email/Password Login:** Submit the login form at `/auth/login` which calls the `loginAction` server action. On success, cookies are set automatically.

2. **Google OAuth:** Click the Google button at `/auth/login` which redirects to Google, then back to `/auth/callback` where `setSessionAction` stores the tokens.

3. **Registration:** Submit the form at `/auth/register` which calls `registerAction`, then redirect to login.

### Token Expiry & Refresh

- Access token expires in 1 hour (3600 seconds)
- Refresh token expires in 30 days
- Tokens are stored in HTTP-only cookies with `sameSite: 'lax'` and `secure: true` in production

### Role-Based Access Control

- **`user`** (default): Can read public content, manage own favorites, update own profile
- **`admin`**: Can create/update/delete content (stories, competitions, pinned messages, memorization plans, site settings)

Admin checks use: `EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')`

### Example Authenticated Request Headers

```http
Cookie: sb_access_token=eyJhbGciOiJIUzI1NiIs...
```

For direct API calls:
```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIs...
```

---

## Error Handling Reference

| HTTP Status | Error Code | Description | Resolution |
|-------------|------------|-------------|------------|
| 400 | INVALID_INPUT | Request validation failed | Check request body against schema |
| 401 | UNAUTHORIZED | Missing or invalid token | Re-authenticate and retry |
| 403 | FORBIDDEN | Insufficient permissions (admin required) | Contact administrator |
| 404 | NOT_FOUND | Resource does not exist | Verify the resource ID |
| 409 | CONFLICT | Resource already exists | Use PUT to update instead |
| 422 | UNPROCESSABLE | Business logic validation failed | Review field-level errors |
| 429 | RATE_LIMITED | Too many requests | Retry after the indicated delay |
| 500 | INTERNAL_ERROR | Unexpected server error | Report to engineering team |

---

## Per-Endpoint Documentation

---

### POST /api/poetry-insight

**Description:** Generates an AI-powered literary analysis of an Islamic poem using Google Gemini.

**Authentication:** None

**Authorization:** None

#### Request

##### Headers
| Header | Required | Description |
|--------|----------|-------------|
| Content-Type | Yes | `application/json` |

##### Request Body
```typescript
interface PoetryInsightRequest {
  poem: string;   // The poem text to analyze
  title: string;  // The poem title
}
```

```json
{
  "poem": "ألا ليت الرياح تعود يوماً...",
  "title": "الشوق"
}
```

#### Responses

##### 200 OK
```json
{
  "insight": "الفكرة الرئيسية: الشوق إلى الأحبة. الأسلوب: شعري عاطفي بليغ. الرسالة: الصبر على الفراق."
}
```

##### 400 Bad Request
```json
{ "error": "Missing poem or title" }
```

##### 500 Internal Server Error
```json
{ "error": "Failed to generate insight" }
```
```json
{ "error": "Internal server error" }
```

---

### POST /auth/login (Server Action: `loginAction`)

**Description:** Authenticates a user with email and password via Supabase, sets session cookies, and redirects.

**Authentication:** None

**Authorization:** None

#### Request (FormData)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User email address |
| password | string | Yes | User password |
| next | string | No | Redirect path after login (default: `/profile`) |

#### Response
- **Success:** 303 redirect to `next` path with cookies set
- **Error:** Redirect to login page with error message

---

### POST /auth/register (Server Action: `registerAction`)

**Description:** Creates a new user account via Supabase signup, then redirects to login.

**Authentication:** None

#### Request (FormData)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User email address |
| password | string | Yes | User password (min 6 chars) |

#### Response
- **Success:** 303 redirect to `/auth/login`
- **Error:** Throws error on duplicate email or weak password

---

### POST /auth/forgot (Server Action: `forgotAction`)

**Description:** Sends a password reset email via Supabase.

**Authentication:** None

#### Request (FormData)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| email | string | Yes | User email address |

#### Response
- **Success:** 303 redirect to `/auth/login`
- **Error:** Throws error if Supabase request fails

---

### POST /auth/logout (Server Action: `logoutAction`)

**Description:** Clears session cookies and redirects to home.

**Authentication:** None (clears existing session)

#### Response
- **Success:** 303 redirect to `/`

---

### POST /auth/set-session (Server Action: `setSessionAction`)

**Description:** Sets session cookies from OAuth callback tokens. Called after Google OAuth redirect.

**Authentication:** None

#### Request
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| accessToken | string | Yes | Supabase access token |
| refreshToken | string | No | Supabase refresh token |

#### Response
- Sets `sb_access_token` and `sb_refresh_token` cookies
- Throws error if accessToken is missing

---

### PATCH /auth/profile (Server Action: `updateProfileAction`)

**Description:** Updates the current user's display name.

**Authentication:** Required (session cookie)

#### Request (FormData)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| displayName | string | No | New display name |

#### Response
- **Success:** 303 redirect to `/profile`
- **Error:** 303 redirect to `/auth/login` if not authenticated

---

### POST /admin/site-setting (Server Action: `saveSiteSettingAction`)

**Description:** Creates or updates a site setting (upsert by key).

**Authentication:** Required
**Authorization:** Admin role

#### Request (FormData)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| key | string | Yes | Setting key |
| title | string | No | Setting title |
| body | string | No | Setting body text |
| imageUrl | string | No | Image URL |
| logoUrl | string | No | Logo URL |
| youtubeChannelUrl | string | No | YouTube channel URL |
| pinnedMessage | string | No | Pinned message text |

#### Response
- **Success:** Revalidates `/admin` and `/` paths
- **Error:** Throws if not admin or key is missing

---

### POST /admin/story (Server Action: `saveStoryAction`)

**Description:** Creates or updates a story (upsert by slug).

**Authentication:** Required
**Authorization:** Admin role

#### Request (FormData)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Story title |
| slug | string | Yes | URL slug |
| content | string | Yes | Story content |
| category | string | No | Category (default: `faith`) |
| mood | string | No | Mood |
| published | boolean | No | Published state |
| coverImage | string | No | Cover image URL |

---

### POST /admin/competition (Server Action: `saveCompetitionAction`)

**Description:** Creates a new competition.

**Authentication:** Required
**Authorization:** Admin role

#### Request (FormData)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Competition title |
| description | string | No | Description |
| prize | string | No | Prize text |
| startsAt | string | No | Start date |
| endsAt | string | No | End date |
| published | boolean | No | Published state |
| imageUrl | string | No | Image URL |
| rules | string | No | Rules text |

---

### POST /admin/pinned-message (Server Action: `savePinnedMessageAction`)

**Description:** Creates a pinned message for the homepage.

**Authentication:** Required
**Authorization:** Admin role

#### Request (FormData)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | No | Message title (default: "رسالة مثبتة") |
| body | string | Yes | Message body |
| ctaLabel | string | No | Call-to-action label |
| ctaHref | string | No | Call-to-action URL |
| published | boolean | No | Published state |

---

### POST /admin/memorization-plan (Server Action: `saveMemorizationPlanAction`)

**Description:** Creates a new memorization plan.

**Authentication:** Required
**Authorization:** Admin role

#### Request (FormData)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| title | string | Yes | Plan title |
| cadence | string | No | Cadence (default: `daily`) |
| targetRef | string | No | Target reference |
| prompt | string | No | Prompt text |
| tajweedFocus | string | No | Tajweed focus area |
| published | boolean | No | Published state |

---

### POST /favorites/add (Server Action: `addFavorite`)

**Description:** Adds an item to the current user's favorites.

**Authentication:** Required

#### Request
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| itemRef | string | Yes | Item reference (e.g. surah ID) |
| itemType | FavoriteItemType | No | Item type: `quran`, `hadith`, `story`, `scholar`, `dua` (default: `quran`) |

#### Response
```typescript
type FavoriteActionResult = { success: true } | { error: string };
```

---

### DELETE /favorites/remove (Server Action: `removeFavorite`)

**Description:** Removes an item from the current user's favorites.

**Authentication:** Required

#### Request
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| itemRef | string | Yes | Item reference |
| itemType | FavoriteItemType | No | Item type (default: `quran`) |

#### Response
```typescript
type FavoriteActionResult = { success: true } | { error: string };
```

---

### GET /favorites/check (Server Action: `isFavorite`)

**Description:** Checks if an item is in the current user's favorites.

**Authentication:** Required

#### Request
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| itemRef | string | Yes | Item reference |
| itemType | FavoriteItemType | No | Item type (default: `quran`) |

#### Response
```typescript
boolean // true if favorited, false otherwise
```

---

### POST /memorization/evaluate (Server Action: `evaluateMemorizationAction`)

**Description:** Evaluates a Quran recitation recording using Google Gemini AI. Returns detailed feedback on memorization quality, tajweed rules, overall score, and review advice.

**Authentication:** None

#### Request (FormData)
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| target | string | No | Target passage reference |
| expectedText | string | No | Expected Quran text |
| audio | File | No | Audio recording (webm/wav) |

#### Response
```typescript
string // AI-generated evaluation in Arabic
```

---

### POST /spiritual-ai/search (Server Action: `searchSpiritualContent`)

**Description:** Searches for spiritual content (Quran verses, hadiths, dhikr) based on a detected feeling, and generates AI advice using Google Gemini.

**Authentication:** None

#### Request
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| feeling | string | Yes | User's feeling text (Arabic) |

#### Response
```typescript
interface AISearchResult {
  feeling: string;
  responses: SpiritualResponse[];
  aiAdvice?: string;
  error?: string;
}

interface SpiritualResponse {
  type: 'quran' | 'hadith' | 'dhikr' | 'advice' | 'poem';
  content: string;
  source?: string;
  reference?: string;
}
```

```json
{
  "feeling": "حزن",
  "responses": [
    { "type": "quran", "content": "إِنَّ مَعَ الْعُسْرِ يُسْرًا", "source": "القرآن الكريم", "reference": "آية 6" },
    { "type": "hadith", "content": "لاَ يُكَلِّفُ اللَّهُ نَفْسًا إِلاَّ وُسْعَهَا", "source": "حديث شريف" },
    { "type": "dhikr", "content": "لا حول ولا قوة إلا بالله", "source": "أذكار" }
  ],
  "aiAdvice": "اعلم أن الله مع الصابرين..."
}
```

---

## Tool Recommendations for Automatic API Documentation

### Primary: Swagger/OpenAPI with `next-swagger-doc`

**Installation:**
```bash
pnpm add next-swagger-doc swagger-ui-react
```

**Configuration (`swagger.config.ts`):**
```typescript
import { getSwaggerConfig } from 'next-swagger-doc';

export const swaggerOptions = getSwaggerConfig({
  title: 'ZIKR API',
  version: '1.0.0',
  apiFolder: 'app/api',
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ZIKR API',
      version: '1.0.0',
    },
  },
});
```

**Pros:** Auto-generates interactive docs at `/api/docs`; JSDoc annotations in route files feed the spec.
**Cons:** Only covers `app/api/` routes, not server actions.

### Secondary Recommendations

| Tool | Installation | Pros | Cons |
|------|-------------|------|------|
| **Scalar** | `pnpm add @scalar/nuxt` or standalone HTML | Modern UI, Vercel-compatible, zero-config | Requires OpenAPI spec as input |
| **Mintlify** | Hosted, GitHub sync | Beautiful hosted docs, public API | External hosting, paid tiers |
| **Postman** | Export OpenAPI spec | Team testing, collections | Manual import step |
| **TypeDoc** | `pnpm add -D typedoc` | TypeScript interface docs | Not API-specific |

### Recommended Setup for ZIKR

1. Use `next-swagger-doc` for the single REST API route (`/api/poetry-insight`)
2. Use this markdown documentation for server actions (they can't be auto-documented by Swagger)
3. Export the OpenAPI YAML (below) for Postman/Scalar consumption
