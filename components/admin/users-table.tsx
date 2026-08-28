"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { updateUserRoleAction } from "@/app/admin/actions";

type UserProfile = {
  id: string;
  display_name: string | null;
  email: string | null;
  role: "user" | "admin" | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export function UsersTable({
  users,
  currentAdminId,
}: {
  users: UserProfile[];
  currentAdminId: string;
}) {
  const [query, setQuery] = useState("");
  const [role, setRole] = useState<"all" | "admin" | "user">("all");
  const [recentOnly, setRecentOnly] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 25;

  const filteredUsers = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    const recentCutoff = Date.now() - 30 * 24 * 60 * 60 * 1000;
    return users.filter(user => {
      const matchesQuery =
        !normalizedQuery ||
        [user.display_name, user.email, user.id]
          .filter(Boolean)
          .some(value => value!.toLocaleLowerCase().includes(normalizedQuery));
      const matchesRole = role === "all" || user.role === role;
      const matchesRecent =
        !recentOnly ||
        Boolean(
          user.created_at && new Date(user.created_at).getTime() >= recentCutoff
        );
      return matchesQuery && matchesRole && matchesRecent;
    });
  }, [query, recentOnly, role, users]);

  const pageCount = Math.max(1, Math.ceil(filteredUsers.length / pageSize));
  const currentPage = Math.min(page, pageCount);
  const visibleUsers = filteredUsers.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const updateQuery = (value: string) => {
    setQuery(value);
    setPage(1);
  };

  const updateRole = (value: "all" | "admin" | "user") => {
    setRole(value);
    setPage(1);
  };

  const toggleRecent = () => {
    setRecentOnly(value => !value);
    setPage(1);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-[1fr_auto_auto]">
        <label className="space-y-1">
          <span className="text-xs arabic-muted">
            بحث بالاسم أو البريد أو المعرّف
          </span>
          <input
            value={query}
            onChange={event => updateQuery(event.target.value)}
            placeholder="ابحث عن مستخدم..."
            className="w-full rounded-xl border border-brand-gold/20 bg-black/25 px-4 py-2.5 text-sm text-brand-cream outline-none focus:border-brand-gold/60"
            dir="rtl"
          />
        </label>
        <label className="space-y-1">
          <span className="text-xs arabic-muted">الدور</span>
          <select
            value={role}
            onChange={event =>
              updateRole(event.target.value as "all" | "admin" | "user")
            }
            className="w-full rounded-xl border border-brand-gold/20 bg-black/25 px-4 py-2.5 text-sm text-brand-cream outline-none focus:border-brand-gold/60"
            dir="rtl"
          >
            <option value="all">كل المستخدمين</option>
            <option value="admin">الأدمن فقط</option>
            <option value="user">المستخدمون فقط</option>
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
              <th className="px-4 py-2">تغيير الدور</th>
            </tr>
          </thead>
          <tbody>
            {visibleUsers.map(user => {
              const isSelf = user.id === currentAdminId;
              const isAdmin = user.role === "admin";
              return (
                <tr key={user.id} className="border-b border-brand-gold/10">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {user.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={user.avatar_url}
                          alt=""
                          className="h-8 w-8 rounded-full object-cover ring-1 ring-brand-gold/20"
                        />
                      ) : (
                        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-black/25 text-xs text-brand-gold/60 ring-1 ring-brand-gold/20">
                          {(
                            user.display_name?.[0] ??
                            user.email?.[0] ??
                            "م"
                          ).toUpperCase()}
                        </span>
                      )}
                      <span>
                        {user.display_name || "مستخدم"}
                        {isSelf && (
                          <span className="mr-1 text-xs text-brand-gold/60">
                            (أنت)
                          </span>
                        )}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-brand-cream/70">
                    {user.email || "—"}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={
                        isAdmin
                          ? "rounded-full bg-brand-gold/20 px-2 py-1 text-xs font-semibold text-brand-gold"
                          : "rounded-full bg-brand-gold/10 px-2 py-1 text-xs text-brand-cream/70"
                      }
                    >
                      {isAdmin ? "أدمن" : "مستخدم"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-brand-cream/70">
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString("ar-SA")
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    {isSelf ? (
                      <span className="text-xs arabic-muted">
                        لا يمكن تعديل نفسك
                      </span>
                    ) : (
                      <form action={updateUserRoleAction} className="inline">
                        <input type="hidden" name="userId" value={user.id} />
                        <input
                          type="hidden"
                          name="role"
                          value={isAdmin ? "user" : "admin"}
                        />
                        <Button size="sm" variant="outline" type="submit">
                          {isAdmin ? "إزالة صلاحية الأدمن" : "ترقية إلى أدمن"}
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
            onClick={() => setPage(value => Math.max(1, value - 1))}
          >
            السابق
          </Button>
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={currentPage === pageCount}
            onClick={() => setPage(value => Math.min(pageCount, value + 1))}
          >
            التالي
          </Button>
        </div>
      )}
    </div>
  );
}
