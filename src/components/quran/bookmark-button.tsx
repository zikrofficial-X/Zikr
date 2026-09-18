"use client";

import { useEffect, useState, useTransition } from "react";
import {
  addFavorite,
  isFavorite,
  removeFavorite,
  type FavoriteItemType,
} from "@/app/favorites/actions";
import { toast } from "sonner";

type BookmarkButtonProps = {
  keyRef: string;
  itemType?: FavoriteItemType;
  /** Pre-fetched value from server to avoid an extra round-trip per item */
  initialSaved?: boolean;
};

export function BookmarkButton({
  keyRef,
  itemType = "quran",
  initialSaved,
}: BookmarkButtonProps) {
  const [isClient, setIsClient] = useState(false);
  const [saved, setSaved] = useState(initialSaved ?? false);
  const [isPending, startTransition] = useTransition();

  // Hydration guard
  useEffect(() => {
    setIsClient(true);
  }, []);

  useEffect(() => {
    if (!isClient) return;
    // Skip the network call if the parent already provided the initial value
    if (initialSaved !== undefined) return;
    isFavorite(keyRef, itemType).then(setSaved);
  }, [keyRef, itemType, isClient, initialSaved]);

  const toggle = () => {
    startTransition(async () => {
      if (saved) {
        const res = await removeFavorite(keyRef, itemType);
        if ("error" in res) {
          toast.error("فشل في إزالة المفضلة");
        } else {
          setSaved(false);
          toast.success("تمت الإزالة من المفضلة");
        }
      } else {
        const res = await addFavorite(keyRef, itemType);
        if ("error" in res) {
          if (res.error === "Unauthorized") {
            toast.error("يرجى تسجيل الدخول لحفظ المفضلة");
          } else {
            toast.error("فشل في إضافة المفضلة");
          }
        } else {
          setSaved(true);
          toast.success("تمت الإضافة إلى المفضلة");
        }
      }
    });
  };

  if (!isClient) {
    return (
      <button
        className="text-sm text-brand-gold/50 disabled:opacity-50 cursor-default"
        disabled
        title="جاري التحميل..."
      >
        ☆ حفظ
      </button>
    );
  }

  return (
    <button
      className="text-sm text-brand-gold disabled:opacity-50 hover:scale-110 transition-transform"
      onClick={toggle}
      disabled={isPending}
      title={saved ? "إزالة من المفضلة" : "إضافة إلى المفضلة"}
    >
      {saved ? "★ محفوظ" : "☆ حفظ"}
    </button>
  );
}
