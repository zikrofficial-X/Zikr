"use client";

import Image from "next/image";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { updateUserRoleAuditedAction } from "@/features/admin/actions/users";
import type { AdminRole } from "@/features/admin/services/permissions";

type UserProfile = {
  id: string;
  display_name: string | null;
  email: string | null;
  role: "user" | "admin" | null;
  effective_role?: string;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

const ROLE_LABELS: Record<AdminRole, string> = {
  user: "مستخدم",
  admin: "مدير عام",
  super_admin: "مدير أعلى",
  content_manager: "مدير محتوى",
  editor: "محرر",
  video_manager: "مدير فيديو",
  social_manager: "مدير نشر اجتماعي",
  moderator: "مشرف",
  seo_manager: "مدير SEO",
  analyst: "محلل",
  support: "دعم",
};

const ASSIGNABLE_ROLE_VALUES: AdminRole[] = [
  "user",
  "admin",
  "content_manager",
  "editor",
  "video_manager",
  "social_manager",
  "moderator",
  "seo_manager",
  "analyst",
  "support",
  "super_admin",
];


export function UsersTable({ users, currentAdminId }: { users: UserProfile[]; currentAdminId: string }) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<"all" | AdminRole>("all");
  const [recentOnly, setRecentOnly] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const recentCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return users.filter((user) => {
      const matchesQuery =
        !normalizedQuery ||
        [user.display_name, user.email, user.id]
          .filter(Boolean)
          .some((value) => value!.toLocaleLowerCase().includes(normalizedQuery));
      const effectiveRole = (user.effective_role ?? user.role ?? "user") as AdminRole;
      const matchesRole = role === "all" || effectiveRole === role;
      const matchesRecent =
        !recentOnly ||
        Boolean(user.created_at && new Date(user.created_at).getTime() >= recentCutoff);
      return matchesQuery && matchesRole && matchesRecent;
    });
  }, [query, recentOnly, role, users]);

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const updateQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const updateRoleFilter = (value: "all" | AdminRole) => {
    setRole(value);
    setPage(1);
  };

  const toggleRecent = () => {
    setRecentOnly((value) => !value);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <label className="space-y-1">
          <span className="text-xs arabic-muted">بحث بالاسم أو البريد أو المعرّف</span>
          <input
            value={query}
            onChange={(event) => updateQuery(event.target.value)}
            placeholder="ابحث عن مستخدم..."
            className="w-full rounded-xl border border-brand-gold/20 bg-black/25 px-4 py-2.5 text-sm text-brand-cream outline-none focus:border-brand-gold/60"
            dir="rtl"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs arabic-muted">الدور الفعلي</span>
          <select
            value={role}
            onChange={(event) => updateRoleFilter(event.target.value as "all" | AdminRole)}
            className="w-full rounded-xl border border-brand-gold/20 bg-black/25 px-4 py-2.5 text-sm text-brand-cream outline-none focus:border-brand-gold/60"
            dir="rtl"
          >
            <option value="all">كل الأدوار</option>
            {ASSIGNABLE_ROLE_VALUES.map((value) => (
              <option key={value} value={value}>
                {ROLE_LABELS[value]}
              </option>
            ))}
          </select>
        </label>
        <div className="flex items-end">
          <Button
            type="button"
            variant={recentOnly ? "primary" : "outline"}
            onClick={toggleRecent}
          >
            {recentOnly ? "كل التسجيلات" : "آخر 30 يومًا"}
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 text-xs arabic-muted">
        <span>
          عرض {visibleUsers.length} من {filteredUsers.length} مستخدم
        </span>
        <span>
          الصفحة {currentPage} من {pageCount}
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-right text-sm">
          <thead>
            <tr className="border-b border-brand-gold/20">
              <th className="px-4 py-2">الاسم</th>
              <th className="px-4 py-2">البريد الإلكتروني</th>
              <th className="px-4 py-2">الدور</th>
              <th className="px-4 py-2">تاريخ التسجيل</th>
              <th className="px-4 py-2">إدارة الدور</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map((user) => {
              const isSelf = user.id === currentAdminId;
              const effectiveRole = (user.effective_role ?? user.role ?? "user") as AdminRole;
              const privileged = effectiveRole !== "user";

              return (
                <tr key={user.id} className="border-b border-brand-gold/10">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {user.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt=""
                          width={32}
                          height={32}
                          sizes="32px"
                          className="h-8 w-8 rounded-full object-cover ring-1 ring-brand-gold/20"
                        />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/25 text-xs text-brand-gold/60 ring-1 ring-brand-gold/20">
                          {(user.display_name?.[0] ?? user.email?.[0] ?? "م").toUpperCase()}
                        </span>
                      )}
                      <span>
                        {user.display_name || "مستخدم"}
                        {isSelf && <span className="mr-1 text-xs text-brand-gold/60">(أنت)</span>}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-brand-cream/70">{user.email || "—"}</td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        privileged
                          ? "rounded-full bg-brand-gold/20 px-2 py-1 text-xs font-semibold text-brand-gold"
                          : "rounded-full bg-brand-gold/10 px-2 py-1 text-xs text-brand-cream/70"
                      }
                    >
                      {ROLE_LABELS[effectiveRole] ?? effectiveRole}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-brand-cream/70">
                    {user.created_at ? new Date(user.created_at).toLocaleDateString("ar-EG-u-nu-latn") : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {isSelf ? (
                      <span className="text-xs arabic-muted">لا يمكن تعديل نفسك</span>
                    ) : (
                      <form action={updateUserRoleAuditedAction} className="flex flex-wrap items-center gap-2">
                        <input type="hidden" name="userId" value={user.id} />
                        <select
                          name="role"
                          defaultValue={effectiveRole}
                          className="rounded-lg border border-brand-gold/20 bg-black/25 px-3 py-2 text-xs text-brand-cream outline-none focus:border-brand-gold/60"
                          dir="rtl"
                        >
                          {ASSIGNABLE_ROLE_VALUES.map((value) => (
                            <option key={value} value={value}>
                              {ROLE_LABELS[value]}
                            </option>
                          ))}
                        </select>
                        <Button size="sm" variant="outline" type="submit">
                          حفظ
                        </Button>
                      </form>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {visibleUsers.length === 0 && (
        <div className="py-8 text-center">
          <p className="arabic-muted">لا توجد نتائج مطابقة.</p>
        </div>
      )}

      {pageCount > 1 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={currentPage === 1}
            onClick={() => setPage((value) => Math.max(1, value - 1))}
          >
            السابق
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={currentPage === pageCount}
            onClick={() => setPage((value) => Math.min(pageCount, value + 1))}
          >
            التالي
          </Button>
        </div>
      )}
    </div>
  );
}
