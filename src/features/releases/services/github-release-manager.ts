import "server-only";

type GitHubCommit = {
  sha: string;
  commit?: { message?: string };
  html_url?: string;
};

type GitHubRelease = {
  id?: number;
  tag_name?: string;
  name?: string;
  draft?: boolean;
  prerelease?: boolean;
  published_at?: string | null;
  html_url?: string;
};

type GitHubRef = { object?: { sha?: string } };

const REPO = "zikr-org/Zikr";
const API = "https://api.github.com";

function token() {
  return process.env.GITHUB_TOKEN ?? process.env.GH_TOKEN ?? "";
}

function headers(): HeadersInit {
  const value = token();
  return {
    Accept: "application/vnd.github+json",
    "Content-Type": "application/json",
    "User-Agent": "ZIKR-admin-release-manager",
    ...(value ? { Authorization: "Bearer " + value } : {}),
  };
}

async function githubJson<T>(path: string, init: RequestInit = {}): Promise<T> {
  if (!token()) throw new Error("GITHUB_TOKEN غير مُعد في بيئة الإنتاج.");
  const response = await fetch(API + path, {
    ...init,
    headers: { ...headers(), ...(init.headers ?? {}) },
    cache: "no-store",
  });
  const body = await response.text();
  let payload: unknown = null;
  try { payload = body ? JSON.parse(body) : null; } catch { payload = body; }
  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload
        ? String((payload as { message?: unknown }).message ?? "")
        : "GitHub API HTTP " + response.status;
    throw new Error(message);
  }
  return payload as T;
}

function decodeBase64(content: string) {
  return Buffer.from(content.replace(/\\n/g, ""), "base64").toString("utf8");
}

function encodeBase64(content: string) {
  return Buffer.from(content, "utf8").toString("base64");
}

async function getTextFile(path: string) {
  const data = await githubJson<{ content?: string; sha?: string }>(
    "/repos/" + REPO + "/contents/" + path + "?ref=main",
  );
  if (!data.content) throw new Error("تعذر قراءة الملف: " + path);
  return { content: decodeBase64(data.content), sha: data.sha ?? "" };
}

async function upsertTextFile(path: string, content: string, sha: string | undefined, message: string) {
  return githubJson<{ commit?: { sha?: string } }>(
    "/repos/" + REPO + "/contents/" + path,
    {
      method: "PUT",
      body: JSON.stringify({
        message,
        content: encodeBase64(content),
        branch: "main",
        ...(sha ? { sha } : {}),
      }),
    },
  );
}

function parseAndroidVersion(
  buildGradle: string,
  packageVersionText = "",
  packageJsonText = "",
) {
  const normalizedGradle = buildGradle.replace(/\r/g, "");
  const versionName =
    normalizedGradle.match(/\bversionName\s*(?:=\s*)?["']([^"']+)["']/)?.[1]?.trim() ??
    packageVersionText.match(/^ZIKR\s+v([^\r\n]+)\s*$/mi)?.[1]?.trim() ??
    packageJsonText.match(/"version"\s*:\s*"([^"]+)"/)?.[1]?.trim();

  const versionCodeRaw =
    normalizedGradle.match(/\bversionCode\s*(?:=\s*)?(\d+)\b/)?.[1] ??
    packageVersionText.match(/^versionCode\s*=\s*(\d+)\s*$/mi)?.[1];
  const versionCode = Number.parseInt(versionCodeRaw ?? "", 10);

  if (!versionName || !Number.isFinite(versionCode)) {
    throw new Error("تعذر قراءة بيانات إصدار Android من build.gradle أو PACKAGE_VERSION.txt.");
  }
  return { versionName, versionCode };
}

function bumpPatch(version: string) {
  const parts = version.replace(/^v/i, "").split(".").map(value => Number.parseInt(value, 10));
  if (parts.length !== 3 || parts.some(value => !Number.isFinite(value))) {
    throw new Error("صيغة الإصدار الحالية غير صالحة: " + version);
  }
  parts[2] += 1;
  return parts.join(".");
}

function categorize(message: string) {
  const first = message.split("\n")[0].trim();
  const lower = first.toLowerCase();
  if (lower.startsWith("feat") || lower.startsWith("add") || lower.startsWith("enhance")) return "features";
  if (lower.startsWith("fix") || lower.startsWith("bug")) return "fixes";
  return "improvements";
}

function buildReleaseNotes(version: string, versionCode: number, mainSha: string, commits: GitHubCommit[], previousTag: string | null) {
  const groups: Record<string, string[]> = { features: [], fixes: [], improvements: [] };
  for (const item of commits) {
    const title = item.commit?.message?.split("\n")[0]?.trim();
    if (!title) continue;
    const line = item.html_url
      ? "- " + title + " ([commit](" + item.html_url + "))"
      : "- " + title;
    groups[categorize(title)].push(line);
  }

  const section = (title: string, key: string) =>
    "## " + title + "\n" +
    (groups[key].length ? groups[key].join("\n") : "- لا توجد تغييرات مصنفة في هذه المجموعة.");

  return [
    "# ZIKR Android v" + version,
    "",
    "إصدار رسمي جديد مبني من أحدث commit على الفرع `main` بعد اجتياز مسار الإصدار.",
    "",
    section("الإضافات والتطويرات", "features"),
    "",
    section("الإصلاحات", "fixes"),
    "",
    section("التحسينات والتغييرات الداخلية", "improvements"),
    "",
    "## معلومات الإصدار",
    "- Android version: `" + version + "`",
    "- Android versionCode: `" + versionCode + "`",
    "- Application ID: `com.zikr.app`",
    "- Target SDK: `36`",
    "- Source commit: `" + mainSha + "`",
    "- Previous stable tag: `" + (previousTag ?? "none") + "`",
    "- Assets expected: signed APK + signed AAB + SHA256SUMS",
    "",
    "> سيتم نشر الـRelease للجمهور فقط بعد نجاح بناء Android والتحقق من التوقيع والنسخ.",
  ].join("\n");
}

export async function prepareAndroidRelease() {
  const ref = await githubJson<GitHubRef>("/repos/" + REPO + "/git/ref/heads/main");
  const mainSha = ref.object?.sha;
  if (!mainSha) throw new Error("تعذر تحديد أحدث commit على main.");

  const buildFile = await getTextFile("android/app/build.gradle");
  const packageFile = await getTextFile("package.json");
  const packageVersionFile = await getTextFile("PACKAGE_VERSION.txt");
  const packageJson = JSON.parse(packageFile.content) as { version?: string };
  const current = parseAndroidVersion(
    buildFile.content,
    packageVersionFile.content,
    packageFile.content,
  );
  const nextVersion = bumpPatch(current.versionName || packageJson.version || "1.0.0");
  const nextVersionCode = current.versionCode + 1;
  const tag = "v" + nextVersion;

  const releases = await githubJson<GitHubRelease[]>(
    "/repos/" + REPO + "/releases?per_page=100&page=1",
  );

  if (releases.some(release => release.tag_name === tag)) {
    throw new Error("الإصدار " + tag + " موجود بالفعل على GitHub.");
  }

  const activeDraft = releases.find(release => release.draft && release.tag_name?.startsWith("v"));
  if (activeDraft) {
    throw new Error("يوجد Release قيد البناء بالفعل: " + activeDraft.tag_name);
  }

  const latestStable = releases
    .filter(release => !release.draft && !release.prerelease && release.tag_name)
    .sort((a, b) => Date.parse(b.published_at ?? "") - Date.parse(a.published_at ?? ""))[0];

  let commits: GitHubCommit[] = [];
  if (latestStable?.tag_name) {
    const compare = await githubJson<{ commits?: GitHubCommit[] }>(
      "/repos/" + REPO + "/compare/" + encodeURIComponent(latestStable.tag_name) + "..." + mainSha,
    );
    commits = (compare.commits ?? []).slice(-50);
  } else {
    commits = await githubJson<GitHubCommit[]>(
      "/repos/" + REPO + "/commits?sha=main&per_page=50",
    );
  }

  const notes = buildReleaseNotes(
    nextVersion,
    nextVersionCode,
    mainSha,
    commits,
    latestStable?.tag_name ?? null,
  );

  const nextBuild = buildFile.content
    .replace(/versionCode\s+\d+/, "versionCode " + nextVersionCode)
    .replace(/versionName\s+"[^"]+"/, 'versionName "' + nextVersion + '"');
  const nextPackage = packageFile.content.replace(
    /"version"\s*:\s*"[^"]+"/,
    '"version": "' + nextVersion + '"',
  );

  await upsertTextFile(
    "android/app/build.gradle",
    nextBuild,
    buildFile.sha,
    "release: prepare Android " + tag,
  );

  await upsertTextFile(
    "package.json",
    nextPackage,
    packageFile.sha,
    "release: bump package version to " + nextVersion,
  );

  const packageVersion = await getTextFile("PACKAGE_VERSION.txt");
  await upsertTextFile(
    "PACKAGE_VERSION.txt",
    "ZIKR v" + nextVersion + "\nversionCode=" + nextVersionCode + "\napplicationId=com.zikr.app\ntargetSdk=36\n",
    packageVersion.sha,
    "release: update Android metadata " + tag,
  );

  const releaseTagFile = await getTextFile(".release-tag");
  await upsertTextFile(
    ".release-tag",
    tag + "\n",
    releaseTagFile.sha,
    "release: set Android release tag " + tag,
  );

  const iosProject = await getTextFile("ios/App/App.xcodeproj/project.pbxproj");
  const nextIosProject = iosProject.content
    .replace(/MARKETING_VERSION = [^;]+;/g, "MARKETING_VERSION = " + nextVersion + ";")
    .replace(/CURRENT_PROJECT_VERSION = [^;]+;/g, "CURRENT_PROJECT_VERSION = " + nextVersionCode + ";");

  await upsertTextFile(
    "ios/App/App.xcodeproj/project.pbxproj",
    nextIosProject,
    iosProject.sha,
    "release: align iOS metadata with " + tag,
  );

  const iosInfo = await getTextFile("ios/App/App/Info.plist");
  const nextIosInfo = iosInfo.content
    .replace(
      new RegExp("(<key>CFBundleShortVersionString</key>\\s*<string>)[^<]+(</string>)"),
      "$1" + nextVersion + "$2",
    )
    .replace(
      new RegExp("(<key>CFBundleVersion</key>\\s*<string>)[^<]+(</string>)"),
      "$1" + nextVersionCode + "$2",
    );

  await upsertTextFile(
    "ios/App/App/Info.plist",
    nextIosInfo,
    iosInfo.sha,
    "release: align iOS bundle metadata with " + tag,
  );

  await upsertTextFile(
    "docs/releases/" + nextVersion + ".md",
    notes + "\n",
    undefined,
    "docs: add Android release notes " + tag,
  );

  const latestHead = await githubJson<GitHubRef>("/repos/" + REPO + "/git/ref/heads/main");
  const taggedSource = latestHead.object?.sha;
  if (!taggedSource) throw new Error("تعذر تحديد commit النهائي للإصدار.");

  const tagObject = await githubJson<{ sha?: string }>(
    "/repos/" + REPO + "/git/tags",
    {
      method: "POST",
      body: JSON.stringify({
        tag,
        message: "ZIKR Android " + tag,
        object: taggedSource,
        type: "commit",
      }),
    },
  );
  if (!tagObject.sha) throw new Error("تعذر إنشاء Git tag object.");

  await githubJson(
    "/repos/" + REPO + "/git/refs",
    {
      method: "POST",
      body: JSON.stringify({ ref: "refs/tags/" + tag, sha: tagObject.sha }),
    },
  );

  const release = await githubJson<GitHubRelease>(
    "/repos/" + REPO + "/releases",
    {
      method: "POST",
      body: JSON.stringify({
        tag_name: tag,
        target_commitish: "main",
        name: "ZIKR Android " + tag,
        body: notes,
        draft: true,
        prerelease: false,
      }),
    },
  );

  return {
    tag,
    version: nextVersion,
    versionCode: nextVersionCode,
    commitSha: taggedSource,
    releaseId: release.id ?? null,
    releaseUrl: release.html_url ?? null,
    notes,
  };
}
