# 🎬 ZIKR Media — Video Publishing & Content Generation Guide

**Status:** Implemented; external credentials and deployment gates are required for live publishing  
**Updated:** September 19, 2026  

---

## 📺 Video Management System

The ZIKR platform includes a complete video management pipeline from creation to publishing on YouTube and Facebook.

### System Components

```
┌─────────────────────────────────────────────────────────┐
│                VIDEO SYSTEM ARCHITECTURE              │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  1. ADMIN DASHBOARD                                    │
│     └─ /admin/videos — Video management interface     │
│                                                         │
│  2. VIDEO UPLOAD                                       │
│     └─ /api/admin/videos/upload — File ingestion      │
│                                                         │
│  3. AI GENERATION (OPTIONAL)                           │
│     └─ Gemini API — AI-powered content creation       │
│     └─ /api/admin/video-generation — Generation API   │
│                                                         │
│  4. VIDEO PROCESSING                                   │
│     └─ /api/internal/video-processing — Encoding      │
│     └─ FFmpeg integration for format conversion       │
│                                                         │
│  5. SOCIAL PUBLISHING                                  │
│     └─ /api/admin/social — Publish to platforms      │
│     └─ Social Media Queue Management                  │
│                                                         │
│  6. PLATFORM SYNC                                      │
│     ├─ YouTube Channel Publishing                      │
│     ├─ Facebook Page Publishing                        │
│     └─ /api/internal/youtube-sync — Sync job          │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

---

## 🚀 Video Publishing Workflow

### Step 1: Create/Upload Video

**via Admin Dashboard:**
```
1. Login to https://zikrmediaofficial.vercel.app/admin
2. Navigate to "Videos" section
3. Click "Create New Video"
4. Upload video file OR generate via AI
```

**API Method:**
```bash
curl -X POST https://zikrmediaofficial.vercel.app/api/admin/videos/upload \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -F "file=@video.mp4" \
  -F "title=Islamic Content Title" \
  -F "description=Video description" \
  -F "category=quran|hadith|stories|etc"
```

### Step 2: Configure Publishing Settings

**Video Details:**
- Title (for all platforms)
- Description (platform-specific)
- Thumbnail (auto-generated or custom)
- Category (Quran, Hadith, Stories, etc.)
- Tags (for search & recommendation)
- Privacy (Public, Unlisted, Private)

### Step 3: Schedule Publishing

**Options:**
- Publish immediately
- Schedule for specific date/time
- Draft for later review

**Configuration:**
```
Publish to:
  ☑ YouTube Channel
  ☑ Facebook Page
  ☐ Instagram (via Facebook)
  ☐ TikTok (manual upload required)
  
Schedule:
  ◉ Immediate
  ○ Scheduled
  
Notification:
  ☑ Send notifications to followers
  ☑ Add to recommended queue
```

### Step 4: Monitor Publishing Status

**Dashboard View:**
- Video encoding progress
- Platform upload status
- Engagement metrics
- Error logs

---

## 🤖 AI Video Generation

Generate videos automatically using Google Gemini API.

### Enable AI Generation

**Configuration:**
1. Set `GEMINI_API_KEY` in environment
2. Set `GEMINI_MODEL` (default: `gemini-3.1-flash-lite`)
3. Set `VIDEO_GENERATOR=template` (in `.env`)

### Generate Video

**via Admin Dashboard:**
```
1. Click "Generate with AI"
2. Select content source:
   - Quran (Surah + Ayah)
   - Hadith (Book + Hadith)
   - Story (Story ID)
   - Article (Article ID)
3. Choose video style/template
4. Generate → Confirm → Publish
```

**API Method:**
```bash
curl -X POST https://zikrmediaofficial.vercel.app/api/admin/video-generation \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "contentType": "quran|hadith|story|article",
    "contentId": "unique-id",
    "videoTemplate": "style-name",
    "language": "ar|en"
  }'
```

**Response:**
```json
{
  "videoId": "vid_123abc",
  "status": "generating",
  "estimatedTime": "2-5 minutes",
  "preview": "https://..."
}
```

---

## 📤 Platform Integration

### YouTube Publishing

**Prerequisites:**
- ✅ YouTube API Key configured
- ✅ YouTube Channel ID set
- ✅ OAuth refresh token valid
- ✅ Channel has upload permissions

**Configuration (.env.example):**
```
YOUTUBE_API_KEY=your_api_key
YOUTUBE_CHANNEL_ID=UC...
YOUTUBE_CLIENT_ID=xxx.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=your_secret
YOUTUBE_REFRESH_TOKEN=refresh_token
```

**Publishing Process:**
1. Create video in ZIKR admin
2. Configure title, description, tags
3. Select YouTube as publishing destination
4. System uploads via YouTube Data API v3
5. Video appears on channel automatically

**Features:**
- ✅ Auto-title with content metadata
- ✅ Full Arabic support
- ✅ Playlist organization (by Surah, Hadith book, etc.)
- ✅ Thumbnail generation
- ✅ Auto-generated captions (if available)
- ✅ SEO-optimized descriptions

### Facebook Publishing

**Prerequisites:**
- ✅ Facebook App ID configured
- ✅ Facebook Page ID set
- ✅ Page Access Token valid
- ✅ Facebook Graph API enabled

**Configuration (.env.example):**
```
FACEBOOK_APP_ID=your_app_id
FACEBOOK_APP_SECRET=your_secret
FACEBOOK_PAGE_ID=page_id
FACEBOOK_PAGE_ACCESS_TOKEN=token
FACEBOOK_GRAPH_API_VERSION=v26.0
```

**Publishing Process:**
1. Create video in ZIKR admin
2. Configure title, description, hashtags
3. Select Facebook as publishing destination
4. System uploads via Facebook Graph API
5. Post appears on page timeline

**Features:**
- ✅ Direct page publishing
- ✅ Hashtag support (#قرآن #حديث)
- ✅ Social features enabled (reactions, comments, shares)
- ✅ Audience insights tracking
- ✅ Share-to-groups enabled

---

## 📊 Social Media Queue Management

### Queue System

Videos can be scheduled for automatic publishing.

**Queue Management UI:**
```
/admin/social → Queue Tab
├─ Pending Videos (to be published)
├─ Scheduled Videos (by date)
├─ Published History (with stats)
└─ Failed Videos (with retry option)
```

**Add to Queue:**
```bash
curl -X POST https://zikrmediaofficial.vercel.app/api/admin/social \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "videoId": "vid_123",
    "platforms": ["youtube", "facebook"],
    "scheduledTime": "2026-09-20T10:00:00Z",
    "title": "Islamic Content",
    "description": "Description...",
    "tags": ["قرآن", "تلاوة"]
  }'
```

### Background Job Processing

**Automated Jobs:**
- ⚙️ `video-background-batch-size: 3` — Process video jobs in controlled batches
- ⚙️ `social-background-batch-size: 10` — Publish social jobs in controlled batches
- ⏱️ Background execution is opt-in through the CircleCI pipeline; there is no implicit hourly Vercel scheduler

---

## ✅ Content Quality Checklist

Before publishing videos, verify:

### Video Quality
- ✅ Resolution: 1920x1080 (Full HD) recommended
- ✅ Format: MP4, WebM, or MOV
- ✅ Duration: 30 seconds to 30 minutes
- ✅ Audio: Clear Arabic recitation or narration
- ✅ Subtitles: Arabic or English recommended

### Content Accuracy
- ✅ Islamic accuracy (verified by scholars)
- ✅ Source attribution (if applicable)
- ✅ No copyright violations
- ✅ Respectful presentation

### Metadata
- ✅ Title: Clear and descriptive
- ✅ Description: Full context and references
- ✅ Tags: Relevant Islamic keywords
- ✅ Thumbnail: Clear and attractive
- ✅ Category: Properly classified

### Platform Compliance
- ✅ YouTube Guidelines: Community Standards compliance
- ✅ Facebook Guidelines: Community Standards compliance
- ✅ Copyright: Proper attribution
- ✅ Language: Arabic or English with subtitles

---

## 🎯 Publishing Best Practices

### Optimal Scheduling

**For Islamic Content:**
- 🕐 Peak Times: After Dhuhr prayer (2-4 PM local time)
- 🕐 Secondary: Evening (7-9 PM) for reflection content
- 📅 Optimal Days: Friday (especially before Jumu'ah)
- 📅 Avoid: During Ramadan intense fasting hours (12 PM - 5 PM)

**Posting Frequency:**
- Daily content: 1-2 videos per day
- Weekly focus: 3-5 videos per week
- Series: Daily during Ramadan

### Content Organization

**YouTube Playlists (Auto-organized):**
- Quran Recitations (by Surah)
- Hadith Collections (by Book)
- Islamic Stories
- Educational Series
- Kids Content
- Spiritual Guidance

**Facebook Albums:**
- Weekly Highlights
- Ramadan Special Content
- Educational Series
- Community Engagement

### Engagement Strategy

**Descriptions Should Include:**
- 📖 Quran reference (if applicable)
- 📚 Hadith source (if applicable)
- 🔗 Related content links
- 📱 Mobile app link
- 💬 Call-to-action (like, share, comment)

**Hashtags:**
```
YouTube: #قرآن #حديث #إسلام #ZIKR #ZIKRMedia
Facebook: #قرآن_الكريم #الحديث_الشريف #ZIKR
```

---

## 🔄 Sync Status Monitoring

### YouTube Sync Job

**Status Check:**
```bash
# View YouTube sync logs
curl https://zikrmediaofficial.vercel.app/api/admin/analytics \
  -H "Authorization: Bearer $AUTH_TOKEN" \
  -d '{"metric": "youtube_sync_status"}'
```

**Troubleshooting:**
- ✅ Token expired? Refresh in `/admin/settings/social`
- ✅ API quota exceeded? Check YouTube API Console
- ✅ Video rejected? Check platform-specific requirements
- ✅ Timeout? Check video file size (max 256GB per YouTube)

### Automatic Sync Features

- ✅ Hourly check for queued videos
- ✅ Automatic retry on temporary failures
- ✅ Detailed error logging
- ✅ Admin email notifications on failures
- ✅ Dashboard status updates

---

## 📊 Analytics & Metrics

### Track Video Performance

**YouTube Metrics:**
- Views, Engagement rate, Click-through rate
- Watch time, Audience retention
- Comments, Shares, Subscribers gained

**Facebook Metrics:**
- Reach, Engagement, Reactions
- Comments, Shares, Post clicks
- Video views, Completion rate

**Dashboard View:**
```
/admin/analytics → Videos tab
├─ Performance by video
├─ Platform comparison
├─ Engagement trends
└─ Audience insights
```

---

## ⚠️ Troubleshooting Guide

### Video Upload Issues

**File too large?**
```
Max file size: 50 GB (YouTube), 4 GB (Facebook via API)
Solution: Compress video using FFmpeg
```

**Format not supported?**
```
Supported: MP4, WebM, AVI, MOV, FLV, WMV
Solution: Convert using: ffmpeg -i input.mkv output.mp4
```

**Upload timeout?**
```
Check: Video file size, Internet connection
Solution: Use resumable upload (built-in)
```

### Publishing Failures

**YouTube API Errors:**
- `403 Forbidden` → Check API permissions & quotas
- `401 Unauthorized` → Refresh OAuth token
- `404 Not Found` → Verify channel ID

**Facebook API Errors:**
- `190 Invalid OAuth Token` → Refresh page access token
- `100 Invalid parameter` → Check field formats
- `613 Calls to this API have exceeded the rate limit` → Wait 1 hour

### Performance Issues

**Slow video encoding?**
- Reduce resolution/bitrate
- Increase FFmpeg workers
- Check server CPU/RAM

**Slow publishing?**
- Reduce batch size if needed
- Check platform API rate limits
- Monitor network bandwidth

---

## 🎬 Quick Start Example

### Complete Video Publishing Flow

```bash
# 1. Generate video with AI
curl -X POST /api/admin/video-generation \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "contentType": "quran",
    "contentId": "surah_1",
    "videoTemplate": "minimal"
  }'

# Response: { videoId: "vid_123", status: "generating" }

# 2. Wait for generation to complete (check status)
curl /api/admin/videos/vid_123 \
  -H "Authorization: Bearer $TOKEN"

# Response shows status: "ready_for_publishing"

# 3. Publish to platforms
curl -X POST /api/admin/social \
  -H "Authorization: Bearer $TOKEN" \
  -d '{
    "videoId": "vid_123",
    "platforms": ["youtube", "facebook"],
    "title": "Surah Al-Fatiha",
    "description": "The opening chapter of the Quran...",
    "tags": ["قرآن", "سورة", "الفاتحة"],
    "scheduledTime": "2026-09-20T14:00:00Z"
  }'

# 4. Monitor publishing progress
curl /api/admin/analytics \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"metric": "social_queue_status"}'
```

---

## 📞 Support & Documentation

**Need Help?**
- 📖 Check `PROJECT_STATUS.md` for system overview
- 🔐 See `AUTH_SYSTEM_GUIDE.md` for auth setup
- 🗄️ Review `DATABASE_SCHEMA_INDEX.md` for data structure

**Platform API Documentation:**
- [YouTube Data API v3](https://developers.google.com/youtube/v3)
- [Facebook Graph API](https://developers.facebook.com/docs/graph-api)
- [Google Gemini API](https://ai.google.dev/docs)

---

**✅ Video Publishing System is FULLY OPERATIONAL and ready for content creation.**

