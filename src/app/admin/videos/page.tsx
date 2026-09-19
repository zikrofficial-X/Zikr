"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Container } from "@/components/ui/container";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { VideoGenerationRequest } from "@/features/videos/services/video-automation";

interface CreateFormState {
  title: string;
  description: string;
  category: "quran" | "hadith" | "story" | "dua" | "adhkar" | "other";
  narration: string;
}

interface DetailModalState {
  isOpen: boolean;
  videoId?: string;
  video?: VideoGenerationRequest;
}

export default function AdminVideosPage() {
  const [requests, setRequests] = useState<VideoGenerationRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [filter, setFilter] = useState<
    "all" | "pending" | "processing" | "completed" | "failed"
  >("all");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [detailModal, setDetailModal] = useState<DetailModalState>({
    isOpen: false,
  });
  const [createForm, setCreateForm] = useState<CreateFormState>({
    title: "",
    description: "",
    category: "quran",
    narration: "",
  });

  const loadRequests = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);
      const response = await fetch("/api/admin/videos", { cache: "no-store" });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        const message =
          response.status === 401
            ? "انتهت جلسة الدخول. سجّل الدخول مرة أخرى."
            : response.status === 403
              ? "ليس لديك صلاحية إدارة الفيديوهات."
              : data.error || "تعذر تحميل طلبات الفيديوهات.";
        setErrorMessage(message);
        setRequests([]);
        return;
      }
      setRequests(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Failed to load video requests:", error);
      setErrorMessage("تعذر الاتصال بالخادم. حاول مرة أخرى.");
    } finally {
      setLoading(false);
    }
  };

  const loadVideoDetails = async (videoId: string) => {
    try {
      const response = await fetch(`/api/admin/videos/${videoId}`, {
        cache: "no-store",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setErrorMessage(
          response.status === 403
            ? "ليس لديك صلاحية عرض تفاصيل الفيديو."
            : data.error || "تعذر تحميل تفاصيل الفيديو."
        );
        return;
      }
      setDetailModal({ isOpen: true, videoId, video: data });
    } catch (error) {
      console.error("Failed to load video details:", error);
      setErrorMessage("تعذر الاتصال بالخادم أثناء تحميل التفاصيل.");
    }
  };

  const handleCreateVideo = async () => {
    if (!createForm.title.trim() || !createForm.description.trim() || !createForm.narration.trim()) {
      alert("يرجى ملء العنوان والوصف والنص الصوتي");
      return;
    }
    if (createForm.narration.trim().length < 30) {
      alert("يجب أن يحتوي النص الصوتي على 30 حرفًا على الأقل");
      return;
    }

    try {
      setCreateLoading(true);
      const response = await fetch("/api/admin/videos/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: createForm.title.trim(),
          description: createForm.description.trim(),
          category: createForm.category,
          narration: createForm.narration.trim(),
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({}));
        setErrorMessage(error.error || "تعذر إنشاء الفيديو.");
        return;
      }

      setErrorMessage(null);
      setCreateForm({
        title: "",
        description: "",
        category: "quran",
            narration: "",
      });
      setShowCreateForm(false);
      void loadRequests();
    } catch (error) {
      console.error("Failed to create video:", error);
      setErrorMessage("تعذر الاتصال بالخادم أثناء إنشاء الفيديو.");
    } finally {
      setCreateLoading(false);
    }
  };

  useEffect(() => {
    void loadRequests();
  }, []);

  const filteredRequests =
    filter === "all" ? requests : requests.filter(r => r.status === filter);

  const statusColors = {
    pending: "bg-yellow-500/20 text-yellow-400",
    processing: "bg-blue-500/20 text-blue-400",
    completed: "bg-green-500/20 text-green-400",
    failed: "bg-red-500/20 text-red-400",
  };

  const statusLabels = {
    pending: "قيد الانتظار",
    processing: "جاري المعالجة",
    completed: "مكتمل",
    failed: "فشل",
  };

  return (
    <Container className="py-12 space-y-8">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-brand-gold">
              🎬 إدارة الفيديوهات
            </h1>
            <p className="text-brand-cream/70">
              إدارة طلبات توليد الفيديوهات والنشر التلقائي
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href="/admin#video-publish"
              className="inline-flex items-center justify-center rounded-lg border border-brand-gold/40 px-4 py-2 text-sm font-semibold text-brand-gold transition hover:bg-brand-gold/10"
            >
              رفع ونشر فيديو
            </Link>
            <Button
              variant="primary"
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="whitespace-nowrap"
            >
              {showCreateForm ? "✕ إغلاق" : "+ إنشاء فيديو جديد"}
            </Button>
          </div>
          {errorMessage && (
            <div
              role="alert"
              className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200"
            >
              {errorMessage}
              <button
                type="button"
                onClick={() => void loadRequests()}
                className="mr-3 underline underline-offset-4"
              >
                إعادة المحاولة
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Create Form */}
      {showCreateForm && (
        <Card className="p-6 space-y-4 border-brand-gold/50 bg-brand-dark/50">
          <h3 className="text-xl font-bold text-brand-gold">
            إنشاء فيديو جديد
          </h3>

          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-brand-cream/80 mb-2">
                العنوان
              </label>
              <Input
                type="text"
                placeholder="عنوان الفيديو"
                value={createForm.title}
                onChange={e =>
                  setCreateForm({ ...createForm, title: e.target.value })
                }
                className="bg-black/30 border-brand-gold/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-cream/80 mb-2">
                الوصف
              </label>
              <Input
                type="text"
                placeholder="وصف الفيديو"
                value={createForm.description}
                onChange={e =>
                  setCreateForm({ ...createForm, description: e.target.value })
                }
                className="bg-black/30 border-brand-gold/30"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-cream/80 mb-2">
                الفئة
              </label>
              <select
                value={createForm.category}
                onChange={e =>
                  setCreateForm({
                    ...createForm,
                    category: e.target.value as CreateFormState["category"],
                  })
                }
                className="w-full px-4 py-2 bg-black/30 border border-brand-gold/30 rounded text-brand-cream focus:outline-none focus:border-brand-gold"
              >
                <option value="quran">القرآن الكريم</option>
                <option value="hadith">الحديث الشريف</option>
                <option value="story">القصص الإسلامية</option>
                <option value="dua">الدعاء والأذكار</option>
                <option value="adhkar">الأذكار</option>
                <option value="other">أخرى</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-brand-cream/80 mb-2">
                النص الذي سيُقرأ في الفيديو (مطلوب، 30 حرفًا على الأقل)
              </label>
              <textarea
                placeholder="اكتب النص المراجع الذي سيُقرأ صوتيًا في الفيديو..."
                value={createForm.narration}
                onChange={e =>
                  setCreateForm({ ...createForm, narration: e.target.value })
                }
                className="w-full h-32 px-4 py-2 bg-black/30 border border-brand-gold/30 rounded text-brand-cream focus:outline-none focus:border-brand-gold resize-none"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="primary"
                onClick={handleCreateVideo}
                disabled={createLoading}
                className="flex-1"
              >
                {createLoading ? "جاري الإنشاء..." : "إنشاء الفيديو"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setShowCreateForm(false);
                  setCreateForm({
                    title: "",
                    description: "",
                    category: "quran",
                                    narration: "",
                  });
                }}
                className="flex-1"
              >
                إلغاء
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Filter Buttons */}
      <div className="flex gap-2 flex-wrap">
        {(["all", "pending", "processing", "completed", "failed"] as const).map(
          status => (
            <Button
              key={status}
              variant={filter === status ? "primary" : "outline"}
              onClick={() => setFilter(status)}
            >
              {status === "all" ? "الكل" : statusLabels[status]}
            </Button>
          )
        )}
      </div>

      {/* Refresh Button */}
      <Button onClick={loadRequests} variant="outline" className="w-full">
        🔄 تحديث
      </Button>

      {/* Loading State */}
      {loading && (
        <Card className="p-8 text-center">
          <p className="text-brand-cream/70">جاري التحميل...</p>
        </Card>
      )}

      {/* Empty State */}
      {!loading && filteredRequests.length === 0 && (
        <Card className="p-8 text-center">
          <p className="text-brand-cream/70">لا توجد طلبات</p>
        </Card>
      )}

      {/* Video Requests List */}
      {!loading && filteredRequests.length > 0 && (
        <div className="space-y-4">
          {filteredRequests.map(request => (
            <Card
              key={request.id}
              className="p-6 space-y-4 border-brand-gold/30"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-brand-gold">
                      {request.title}
                    </h3>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[request.status]}`}
                    >
                      {statusLabels[request.status]}
                    </span>
                  </div>
                  <p className="text-brand-cream/80 text-sm">
                    {request.description}
                  </p>
                  <div className="flex gap-4 text-sm text-brand-cream/60">
                    <span>📁 {request.category}</span>
                    <span>
                      📅{" "}
                      {new Date(request.created_at).toLocaleDateString("ar-SA")}
                    </span>
                  </div>
                </div>
              </div>

              {/* Status Details */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                {request.youtube_id && (
                  <div className="p-3 bg-red-500/10 rounded border border-red-500/30">
                    <p className="text-red-400 font-medium">YouTube</p>
                    <p className="text-red-300/70 text-xs break-all">
                      {request.youtube_id}
                    </p>
                  </div>
                )}
                {request.facebook_id && (
                  <div className="p-3 bg-blue-500/10 rounded border border-blue-500/30">
                    <p className="text-blue-400 font-medium">Facebook</p>
                    <p className="text-blue-300/70 text-xs break-all">
                      {request.facebook_id}
                    </p>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button
                  variant="primary"
                  className="flex-1"
                  onClick={() => loadVideoDetails(request.id)}
                >
                  👁️ التفاصيل
                </Button>
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    navigator.clipboard.writeText(request.id);
                    alert("تم نسخ المعرف");
                  }}
                >
                  📋 نسخ
                </Button>
                {request.status === "failed" && (
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={async () => {
                      try {
                        const response = await fetch(
                          `/api/admin/videos/${request.id}/retry`,
                          {
                            method: "POST",
                          }
                        );
                        if (response.ok) {
                          alert("تم إعادة محاولة الطلب");
                          loadRequests();
                        } else {
                          alert("فشلت إعادة المحاولة");
                        }
                      } catch (error) {
                        console.error("Failed to retry:", error);
                        alert("حدث خطأ في إعادة المحاولة");
                      }
                    }}
                  >
                    🔄 إعادة
                  </Button>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Statistics */}
      <Card className="p-6 grid grid-cols-2 md:grid-cols-4 gap-4 bg-brand-gold/10 border-brand-gold/30">
        <div className="text-center space-y-2">
          <p className="text-brand-cream/70 text-sm">إجمالي الطلبات</p>
          <p className="text-2xl font-bold text-brand-gold">
            {requests.length}
          </p>
        </div>
        <div className="text-center space-y-2">
          <p className="text-brand-cream/70 text-sm">قيد الانتظار</p>
          <p className="text-2xl font-bold text-yellow-400">
            {requests.filter(r => r.status === "pending").length}
          </p>
        </div>
        <div className="text-center space-y-2">
          <p className="text-brand-cream/70 text-sm">مكتملة</p>
          <p className="text-2xl font-bold text-green-400">
            {requests.filter(r => r.status === "completed").length}
          </p>
        </div>
        <div className="text-center space-y-2">
          <p className="text-brand-cream/70 text-sm">فشل</p>
          <p className="text-2xl font-bold text-red-400">
            {requests.filter(r => r.status === "failed").length}
          </p>
        </div>
      </Card>

      {/* Info */}
      <Card className="p-6 space-y-3 bg-black/30 border-brand-gold/30">
        <h3 className="text-lg font-bold text-brand-gold">ℹ️ معلومات</h3>
        <ul className="space-y-2 text-brand-cream/80 text-sm">
          <li>• يتم معالجة الطلبات تلقائياً بواسطة نظام الأتمتة</li>
          <li>• يمكن نشر الفيديوهات على YouTube و Facebook تلقائياً</li>
          <li>• يتم حفظ معرفات الفيديوهات المنشورة لكل منصة</li>
          <li>• في حالة الفشل، يمكن إعادة محاولة الطلب</li>
        </ul>
      </Card>

      {/* Detail Modal */}
      {detailModal.isOpen && detailModal.video && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto space-y-6 p-6">
            <div className="flex items-center justify-between gap-4">
              <h2 className="text-2xl font-bold text-brand-gold">
                تفاصيل الفيديو
              </h2>
              <Button
                variant="outline"
                onClick={() => setDetailModal({ isOpen: false })}
              >
                ✕
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-brand-cream/60 text-sm">المعرف</p>
                <p className="text-brand-cream font-mono break-all">
                  {detailModal.video.id}
                </p>
              </div>

              <div>
                <p className="text-brand-cream/60 text-sm">العنوان</p>
                <p className="text-brand-cream text-lg font-semibold">
                  {detailModal.video.title}
                </p>
              </div>

              <div>
                <p className="text-brand-cream/60 text-sm">الوصف</p>
                <p className="text-brand-cream/80">
                  {detailModal.video.description}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-brand-cream/60 text-sm">الفئة</p>
                  <p className="text-brand-cream">
                    {detailModal.video.category}
                  </p>
                </div>
                <div>
                  <p className="text-brand-cream/60 text-sm">الحالة</p>
                  <p className="text-brand-cream">{detailModal.video.status}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-brand-cream/60 text-sm">تاريخ الإنشاء</p>
                  <p className="text-brand-cream/80 text-sm">
                    {new Date(detailModal.video.created_at).toLocaleDateString(
                      "ar-SA"
                    )}
                  </p>
                </div>
                <div>
                  <p className="text-brand-cream/60 text-sm">آخر تحديث</p>
                  <p className="text-brand-cream/80 text-sm">
                    {new Date(detailModal.video.updated_at).toLocaleDateString(
                      "ar-SA"
                    )}
                  </p>
                </div>
              </div>

              {detailModal.video.youtube_id && (
                <div>
                  <p className="text-brand-cream/60 text-sm">معرف YouTube</p>
                  <p className="text-red-400 font-mono break-all">
                    {detailModal.video.youtube_id}
                  </p>
                </div>
              )}

              {detailModal.video.facebook_id && (
                <div>
                  <p className="text-brand-cream/60 text-sm">معرف Facebook</p>
                  <p className="text-blue-400 font-mono break-all">
                    {detailModal.video.facebook_id}
                  </p>
                </div>
              )}

              {detailModal.video.error_message && (
                <div>
                  <p className="text-brand-cream/60 text-sm">رسالة الخطأ</p>
                  <p className="text-red-400 text-sm">
                    {detailModal.video.error_message}
                  </p>
                  {detailModal.video.error_details && (
                    <p className="text-red-300/70 text-xs break-all">
                      {detailModal.video.error_details}
                    </p>
                  )}
                </div>
              )}

              <div>
                <p className="text-brand-cream/60 text-sm">المحتوى</p>
                <pre className="bg-black/50 p-3 rounded border border-brand-gold/30 text-xs overflow-x-auto text-brand-cream/70">
                  {typeof detailModal.video.content === "string"
                    ? detailModal.video.content
                    : JSON.stringify(detailModal.video.content, null, 2)}
                </pre>
              </div>
            </div>

            <div className="flex gap-2 pt-4 border-t border-brand-gold/30">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  navigator.clipboard.writeText(detailModal.video!.id);
                  alert("تم نسخ المعرف");
                }}
              >
                📋 نسخ المعرف
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDetailModal({ isOpen: false })}
              >
                إغلاق
              </Button>
            </div>
          </Card>
        </div>
      )}
    </Container>
  );
}
