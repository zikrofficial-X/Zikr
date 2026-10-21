import {
  ADMIN_PERMISSIONS,
  ADMIN_ROLE_PERMISSIONS,
  type AdminRole,
} from "@/features/admin/services/permissions";

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

const ROLE_ORDER: AdminRole[] = [
  "super_admin",
  "admin",
  "content_manager",
  "editor",
  "video_manager",
  "social_manager",
  "moderator",
  "seo_manager",
  "analyst",
  "support",
  "user",
];

export function RolePermissionsMatrix() {
  return (
    <section className="space-y-4" aria-labelledby="role-permissions-title" dir="rtl">
      <div>
        <h2 id="role-permissions-title" className="text-2xl text-brand-gold">
          مصفوفة الأدوار والصلاحيات
        </h2>
        <p className="mt-1 text-sm arabic-muted">
          راجع نطاق كل دور قبل إسناده. هذه الصلاحيات تُطبّق على الخادم وتظهر هنا للشفافية فقط.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {ROLE_ORDER.map((role) => {
          const permissions = ADMIN_ROLE_PERMISSIONS[role];
          const isElevated = role === "admin" || role === "super_admin";
          return (
            <article
              key={role}
              className={`rounded-2xl border p-4 ${
                isElevated
                  ? "border-brand-gold/25 bg-brand-gold/5"
                  : "border-brand-gold/10 bg-black/15"
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="font-bold text-brand-cream">{ROLE_LABELS[role]}</h3>
                  <p className="mt-1 text-[11px] text-brand-cream/40" dir="ltr">
                    {role}
                  </p>
                </div>
                <span className="rounded-full border border-brand-gold/15 px-2 py-1 text-xs text-brand-gold">
                  {permissions.length} صلاحية
                </span>
              </div>

              <div className="mt-3 flex flex-wrap gap-1.5">
                {permissions.slice(0, 4).map((permission) => (
                  <span
                    key={permission}
                    className="rounded-md bg-black/25 px-2 py-1 text-[11px] text-brand-cream/65"
                  >
                    {ADMIN_PERMISSIONS[permission]}
                  </span>
                ))}
              </div>

              {permissions.length > 4 ? (
                <details className="mt-3 border-t border-brand-gold/10 pt-3">
                  <summary className="cursor-pointer text-xs font-semibold text-brand-gold/75 hover:text-brand-gold">
                    عرض جميع الصلاحيات ({permissions.length})
                  </summary>
                  <ul className="mt-2 space-y-1.5 text-xs text-brand-cream/65">
                    {permissions.map((permission) => (
                      <li key={permission} className="flex gap-2">
                        <span className="text-brand-gold" aria-hidden="true">✓</span>
                        <span>{ADMIN_PERMISSIONS[permission]}</span>
                      </li>
                    ))}
                  </ul>
                </details>
              ) : (
                <p className="mt-3 text-xs text-brand-cream/35">لا توجد صلاحيات إدارية.</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
