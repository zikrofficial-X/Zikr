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
type GitHubGitCommit = { tree?: { sha?: string } };

class GitHubApiError extends Error {
  readonly status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "GitHubApiError";
    this.status = status;
  }
}

const REPO = process.env.GITHUB_REPOSITORY?.trim() || "zikrofficial-X/Zikr";
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
  try {
    payload = body ? JSON.parse(body) : null;
  } catch {
    payload = body;
  }
  if (!response.ok) {
    const message =
      typeof payload === "object" && payload && "message" in payload
        ? String((payload as { message?: unknown }).message ?? "")
        : "GitHub API HTTP " + response.status;
    throw new GitHubApiError(message || "GitHub API HTTP " + response.status, response.status);
  }
  return payload as T;
}

function decodeBase64(content: string) {
  return Buffer.from(content.replace(/\\n/g, "").replace(/\s/g, ""), "base64").toString("utf8");
}

function encodeBase64(content: string) {
  return Buffer.from(content, "utf8").toString("base64");
}

function repositoryPath(path: string) {
  return path.split("/").map(encodeURIComponent).join("/");
}

async function getTextFile(path: string, ref: string) {
  const data = await githubJson<{ content?: string }>(
    "/repos/" + REPO + "/contents/" + repositoryPath(path) + "?ref=" + encodeURIComponent(ref),
  );
  if (typeof data.content !== "string") throw new Error("تعذر قراءة الملف: " + path);
  return decodeBase64(data.content);
}

async function getOptionalTextFile(path: string, ref: string) {
  try {
    return await getTextFile(path, ref);
  } catch (error) {
    if (error instanceof GitHubApiError && error.status === 404) return null;
    throw error;
  }
}

function replaceMatchesExactly(
  content: string,
  pattern: RegExp,
  replacement: string,
  expectedMatches: number,
  label: string,
) {
  if (!pattern.global) throw new Error("يجب أن يكون نمط الاستبدال global: " + label);
  const matches = [...content.matchAll(pattern)];
  if (matches.length !== expectedMatches) {
    throw new Error(
      "تعذر تحديث " + label + ": المتوقع " + expectedMatches + " تطابق، والموجود " + matches.length + ".",
    );
  }
  return content.replace(pattern, replacement);
}

function assertAllVersionsMatch(
  content: string,
  pattern: RegExp,
  expectedValue: string,
  expectedMatches: number,
  label: string,
) {
  const values = [...content.matchAll(pattern)].map(match => match[1]);
  if (values.length !== expectedMatches || values.some(value => value !== expectedValue)) {
    throw new Error(
      "تعارض في بيانات " + label + ": القيم يجب أن تكون " + expectedValue +
      " في " + expectedMatches + " مواضع، والقيم الحالية: " + values.join(", "),
    );
  }
}

function parseAndroidVersion(buildGradle: string) {
  const normalizedGradle = buildGradle.replace(/\r/g, "");
  const versionName = normalizedGradle.match(/\bversionName\s*(?:=\s*)?["']([^"']+)["']/)?.[1]?.trim();
  const versionCodeRaw = normalizedGradle.match(/\bversionCode\s*(?:=\s*)?(\d+)\b/)?.[1];
  const versionCode = Number.parseInt(versionCodeRaw ?? "", 10);

  if (!versionName || !Number.isSafeInteger(versionCode) || versionCode < 1) {
    throw new Error("تعذر قراءة بيانات إصدار Android الصحيحة من android/app/build.gradle.");
  }
  return { versionName, versionCode };
}

function bumpPatch(version: string) {
  const parts = version.replace(/^v/i, "").split(".").map(value => Number.parseInt(value, 10));
  if (parts.length !== 3 || parts.some(value => !Number.isSafeInteger(value) || value < 0)) {
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

function buildReleaseNotes(
  version: string,
  versionCode: number,
  baseSha: string,
  commits: GitHubCommit[],
  previousTag: string | null,
) {
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

  const tick = String.fromCharCode(96);
  return [
    "# ZIKR Android v" + version,
    "Release tag: " + tick + "v" + version + tick,
    "",
    "إصدار رسمي جديد مبني من أحدث commit على الفرع main بعد اجتياز مسار الإصدار.",
    "",
    section("الإضافات والتطويرات", "features"),
    "",
    section("الإصلاحات", "fixes"),
    "",
    section("التحسينات والتغييرات الداخلية", "improvements"),
    "",
    "## معلومات الإصدار",
    "- Android version: " + tick + version + tick,
    "- Android versionCode: " + tick + versionCode + tick,
    "- Application ID: " + tick + "com.zikr.app" + tick,
    "- Target SDK: " + tick + "36" + tick,
    "- Preparation base commit: " + tick + baseSha + tick,
    "- Previous stable tag: " + tick + (previousTag ?? "none") + tick,
    "- Assets expected: signed APK + signed AAB + SHA256SUMS",
    "",
    "> سيتم نشر الـRelease للجمهور فقط بعد نجاح بناء Android والتحقق من التوقيع والنسخ.",
  ].join("\n");
}

/**
 * Build all release metadata from one immutable main snapshot and update main
 * exactly once. The non-force ref update is the final fast-forward guard:
 * if another writer advances main, GitHub rejects this commit rather than
 * overwriting or silently tagging somebody else's changes.
 */
async function createAtomicMainCommit(baseSha: string, files: Record<string, string>) {
  const baseCommit = await githubJson<GitHubGitCommit>(
    "/repos/" + REPO + "/git/commits/" + baseSha,
  );
  const baseTreeSha = baseCommit.tree?.sha;
  if (!baseTreeSha) throw new Error("تعذر تحديد Git tree للـcommit الأساسي.");

  const entries = await Promise.all(
    Object.entries(files).map(async ([path, content]) => {
      const blob = await githubJson<{ sha?: string }>(
        "/repos/" + REPO + "/git/blobs",
        {
          method: "POST",
          body: JSON.stringify({
            content: encodeBase64(content),
            encoding: "base64",
          }),
        },
      );
      if (!blob.sha) throw new Error("تعذر إنشاء Git blob للملف: " + path);
      return { path, mode: "100644", type: "blob", sha: blob.sha };
    }),
  );

  const tree = await githubJson<{ sha?: string }>(
    "/repos/" + REPO + "/git/trees",
    {
      method: "POST",
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: entries,
      }),
    },
  );
  if (!tree.sha) throw new Error("تعذر إنشاء Git tree موحد لملفات الإصدار.");

  const commit = await githubJson<{ sha?: string }>(
    "/repos/" + REPO + "/git/commits",
    {
      method: "POST",
      body: JSON.stringify({
        message: "release: prepare Android " + files[".release-tag"].trim() + " atomically",
        tree: tree.sha,
        parents: [baseSha],
      }),
    },
  );
  if (!commit.sha) throw new Error("تعذر إنشاء commit موحد لبيانات الإصدار.");

  const latestRef = await githubJson<GitHubRef>(
    "/repos/" + REPO + "/git/ref/heads/main",
  );
  if (latestRef.object?.sha !== baseSha) {
    throw new Error(
      "تغير فرع main أثناء تجهيز الإصدار. لم يتم تحديث الفرع؛ أعد الفحص قبل المحاولة مرة أخرى.",
    );
  }

  await githubJson(
    "/repos/" + REPO + "/git/refs/heads/main",
    {
      method: "PATCH",
      body: JSON.stringify({
        sha: commit.sha,
        force: false,
      }),
    },
  );

  const verifiedRef = await githubJson<GitHubRef>(
    "/repos/" + REPO + "/git/ref/heads/main",
  );
  if (verifiedRef.object?.sha !== commit.sha) {
    throw new Error("تم إنشاء commit الإصدار لكن تعذر تأكيد انتقال main إلى نفس الـcommit.");
  }

  return commit.sha;
}

export async function prepareAndroidRelease() {
  const ref = await githubJson<GitHubRef>("/repos/" + REPO + "/git/ref/heads/main");
  const baseSha = ref.object?.sha;
  if (!baseSha) throw new Error("تعذر تحديد أحدث commit على main.");

  const [
    buildGradle,
    packageText,
    footerText,
    releaseTagText,
    iosProjectText,
    iosInfoText,
  ] = await Promise.all([
    getTextFile("android/app/build.gradle", baseSha),
    getTextFile("package.json", baseSha),
    getTextFile("src/components/layout/footer.tsx", baseSha),
    getTextFile(".release-tag", baseSha),
    getTextFile("ios/App/App.xcodeproj/project.pbxproj", baseSha),
    getTextFile("ios/App/App/Info.plist", baseSha),
  ]);

  const packageJson = JSON.parse(packageText) as { version?: string };
  const current = parseAndroidVersion(buildGradle);
  const packageVersion = String(packageJson.version ?? "");
  const currentTag = releaseTagText.trim();

  if (packageVersion !== current.versionName) {
    throw new Error(
      "تعارض إصدار التطبيق: package.json=" + packageVersion +
      " بينما Android versionName=" + current.versionName + ".",
    );
  }
  if (currentTag !== "v" + current.versionName) {
    throw new Error(
      "تعارض وسم الإصدار الحالي: .release-tag=" + currentTag +
      " بينما الإصدار الحالي يجب أن يكون v" + current.versionName + ".",
    );
  }

  assertAllVersionsMatch(
    footerText,
    /const APP_VERSION = "([^"]+)";/g,
    current.versionName,
    1,
    "نسخة Footer",
  );
  assertAllVersionsMatch(
    iosProjectText,
    /MARKETING_VERSION = ([^;]+);/g,
    current.versionName,
    2,
    "iOS MARKETING_VERSION",
  );
  assertAllVersionsMatch(
    iosProjectText,
    /CURRENT_PROJECT_VERSION = ([^;]+);/g,
    String(current.versionCode),
    2,
    "iOS CURRENT_PROJECT_VERSION",
  );
  assertAllVersionsMatch(
    iosInfoText,
    /<key>CFBundleShortVersionString<\/key>\s*<string>([^<]+)<\/string>/g,
    current.versionName,
    1,
    "iOS CFBundleShortVersionString",
  );
  assertAllVersionsMatch(
    iosInfoText,
    /<key>CFBundleVersion<\/key>\s*<string>([^<]+)<\/string>/g,
    String(current.versionCode),
    1,
    "iOS CFBundleVersion",
  );

  const nextVersion = bumpPatch(current.versionName);
  const nextVersionCode = current.versionCode + 1;
  if (!Number.isSafeInteger(nextVersionCode)) {
    throw new Error("Android versionCode تجاوز الحد الآمن للأرقام.");
  }
  const tag = "v" + nextVersion;
  const notesPath = "docs/releases/" + nextVersion + ".md";

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

  if (await getOptionalTextFile(notesPath, baseSha)) {
    throw new Error("ملف ملاحظات الإصدار موجود مسبقاً: " + notesPath);
  }

  const latestStable = releases
    .filter(release => !release.draft && !release.prerelease && release.tag_name)
    .sort((a, b) => Date.parse(b.published_at ?? "") - Date.parse(a.published_at ?? ""))[0];

  let commits: GitHubCommit[] = [];
  if (latestStable?.tag_name) {
    const compare = await githubJson<{ commits?: GitHubCommit[] }>(
      "/repos/" + REPO + "/compare/" + encodeURIComponent(latestStable.tag_name) + "..." + baseSha,
    );
    commits = (compare.commits ?? []).slice(-50);
  } else {
    commits = await githubJson<GitHubCommit[]>(
      "/repos/" + REPO + "/commits?sha=" + encodeURIComponent(baseSha) + "&per_page=50",
    );
  }

  const notes = buildReleaseNotes(
    nextVersion,
    nextVersionCode,
    baseSha,
    commits,
    latestStable?.tag_name ?? null,
  );

  const nextBuild = replaceMatchesExactly(
    replaceMatchesExactly(
      buildGradle,
      /\bversionCode\s+\d+\b/g,
      "versionCode " + nextVersionCode,
      1,
      "Android versionCode",
    ),
    /\bversionName\s+"[^"]+"/g,
    'versionName "' + nextVersion + '"',
    1,
    "Android versionName",
  );
  const nextPackage = replaceMatchesExactly(
    packageText,
    /"version"\s*:\s*"[^"]+"/g,
    '"version": "' + nextVersion + '"',
    1,
    "package.json version",
  );
  const nextFooter = replaceMatchesExactly(
    footerText,
    /const APP_VERSION = "[^"]+";/g,
    'const APP_VERSION = "' + nextVersion + '";',
    1,
    "Footer APP_VERSION",
  );
  const nextReleaseTag = tag + "\n";
  const nextIosProject = replaceMatchesExactly(
    replaceMatchesExactly(
      iosProjectText,
      /MARKETING_VERSION = [^;]+;/g,
      "MARKETING_VERSION = " + nextVersion + ";",
      2,
      "iOS MARKETING_VERSION",
    ),
    /CURRENT_PROJECT_VERSION = [^;]+;/g,
    "CURRENT_PROJECT_VERSION = " + nextVersionCode + ";",
    2,
    "iOS CURRENT_PROJECT_VERSION",
  );
  const nextIosInfo = replaceMatchesExactly(
    replaceMatchesExactly(
      iosInfoText,
      /(<key>CFBundleShortVersionString<\/key>\s*<string>)[^<]+(<\/string>)/g,
      "$1" + nextVersion + "$2",
      1,
      "iOS CFBundleShortVersionString",
    ),
    /(<key>CFBundleVersion<\/key>\s*<string>)[^<]+(<\/string>)/g,
    "$1" + nextVersionCode + "$2",
    1,
    "iOS CFBundleVersion",
  );

  const files: Record<string, string> = {
    "android/app/build.gradle": nextBuild,
    "package.json": nextPackage,
    "src/components/layout/footer.tsx": nextFooter,
    ".release-tag": nextReleaseTag,
    "ios/App/App.xcodeproj/project.pbxproj": nextIosProject,
    "ios/App/App/Info.plist": nextIosInfo,
    [notesPath]: notes + "\n",
  };

  const preparedCommitSha = await createAtomicMainCommit(baseSha, files);

  const tagObject = await githubJson<{ sha?: string }>(
    "/repos/" + REPO + "/git/tags",
    {
      method: "POST",
      body: JSON.stringify({
        tag,
        message: "ZIKR Android " + tag,
        object: preparedCommitSha,
        type: "commit",
      }),
    },
  );
  if (!tagObject.sha) throw new Error("تم تجهيز commit الإصدار لكن تعذر إنشاء Git tag object.");

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
    commitSha: preparedCommitSha,
    releaseId: release.id ?? null,
    releaseUrl: release.html_url ?? null,
    notes,
  };
}
