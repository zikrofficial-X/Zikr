export const dynamic = "force-dynamic";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { requireAdmin } from "@/lib/services/admin";
import {
  supabaseServerAdminRequest,
  supabaseServerAdminCount,
} from "@/lib/supabase/server";
import { UsersTable } from "@/components/admin/users-table";

interface UserProfile {
  id: string;
  display_name: string | null;
  email: string | null;
  role: "user" | "admin" | null;
  avatar_url: string | null;
  created_at: string | null;
  updated_at: string | null;
}

interface AdminActionAudit {
  id: string;
  user_id: string | null;
  action: string;
  meta: Record<string, unknown> | null;
  created_at: string;
}

async function getRecentAdminActions(): Promise<AdminActionAudit[]> {
  try {
    return await supabaseServerAdminRequest<AdminActionAudit[]>(
      "/rest/v1/admin_actions_audit?select=id,user_id,action,meta,created_at&order=created_at.desc&limit=12",
      { cache: "no-store" }
    );
  } catch (error) {
    console.error("Failed to fetch admin activity:", error);
    return [];
  }
}

async function getUsers(): Promise<UserProfile[]> {
  try {
    const users = await supabaseServerAdminRequest<UserProfile[]>(
      "/rest/v1/profiles?select=id,display_name,email,role,avatar_url,created_at,updated_at&order=created_at.desc&limit=200",
      { cache: "no-store" }
    );
    return users || [];
  } catch (error) {
    console.error("Failed to fetch users:", error);
    return [];
  }
}

export default async function AdminUsersPage() {
  const currentAdmin = await requireAdmin();
  const [users, totalUsers, recentActions] = await Promise.all([
    getUsers(),
    supabaseServerAdminCount("profiles"),
    getRecentAdminActions(),
  ]);

  const adminCount = users.filter(u => u.role === "admin").length;
  const now = new Date().getTime();
  const thirtyDaysAgoMs = now - 30 * 24 * 60 * 60 * 1000;
  const recentCount = users.filter(
    u => u.created_at && new Date(u.created_at).getTime() > thirtyDaysAgoMs
  ).length;

  return (
    <Container className="space-y-8 py-10 text-right">
      <section className="space-y-3">
        <h1 className="text-3xl font-bold text-brand-gold">إدارة المستخدمين</h1>
        <p className="max-w-3xl leading-8 arabic-muted">
          عرض وإدارة جميع مستخدمي الموقع والتحكم في الأدوار والصلاحيات
        </p>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Card>
          <p className="text-sm arabic-muted">إجمالي المستخدمين</p>
          <strong className="text-3xl text-brand-gold">{totalUsers}</strong>
        </Card>
        <Card>
          <p className="text-sm arabic-muted">مسجلون خلال 30 يومًا</p>
          <strong className="text-3xl text-brand-gold">{recentCount}</strong>
        </Card>
        <Card>
          <p className="text-sm arabic-muted">عدد الأدمن</p>
          <strong className="text-3xl text-brand-gold">{adminCount}</strong>
        </Card>
      </section>

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl text-brand-gold">قائمة المستخدمين</h2>
            <p className="text-sm arabic-muted">
              ابحث، صفِّ النتائج، وغيّر الأدوار بأمان.
            </p>
          </div>
          <span className="rounded-full bg-brand-gold/10 px-3 py-1 text-xs text-brand-gold">
            حتى 200 مستخدم في الصفحة
          </span>
        </div>
        <UsersTable users={users} currentAdminId={currentAdmin.id} />
      </Card>

      <Card className="space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-2xl text-brand-gold">آخر إجراءات الإدارة</h2>
            <p className="text-sm arabic-muted">
              سجل مختصر لتغييرات الصلاحيات والإجراءات الحساسة.
            </p>
          </div>
          <span className="text-xs arabic-muted">
            {recentActions.length} إجراء
          </span>
        </div>
        {recentActions.length === 0 ? (
          <p className="py-6 text-center arabic-muted">
            لا توجد إجراءات مسجلة حتى الآن.
          </p>
        ) : (
          <div className="space-y-2">
            {recentActions.map(action => (
              <div
                key={action.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-brand-gold/10 bg-black/15 px-4 py-3"
              >
                <div>
                  <p className="text-sm text-brand-cream">{action.action}</p>
                  <p className="text-xs arabic-muted">
                    {action.user_id
                      ? `المستخدم: ${action.user_id}`
                      : "إجراء عام"}
                  </p>
                </div>
                <time
                  className="text-xs text-brand-cream/50"
                  dateTime={action.created_at}
                >
                  {new Date(action.created_at).toLocaleString("ar-SA")}
                </time>
              </div>
            ))}
          </div>
        )}
      </Card>
    </Container>
  );
}
