'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface KidsShareProps {
  title: string;
  description?: string;
  slug: string;
  type: string;
  imageUrl?: string;
}

export function KidsShare({
  title,
  description,
  slug,
  type,
  imageUrl,
}: KidsShareProps) {
  const [shared, setShared] = useState(false);
  const shareUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/kids/${slug}`;
  
  const handleFacebookShare = () => {
    if (typeof window === 'undefined') return;
    
    const facebookShareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(title)}`;
    window.open(facebookShareUrl, 'facebook-share', 'width=600,height=400');
    setShared(true);
    
    // Track the share if available
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'kids_content_shared', {
        content_title: title,
        content_type: type,
        share_platform: 'facebook',
      });
    }
  };

  const handleWhatsAppShare = () => {
    if (typeof window === 'undefined') return;
    
    const message = `🌟 تعلم مع الأطفال: ${title}\n\n${description || 'محتوى تعليمي إسلامي مميز'}\n\n${shareUrl}`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    setShared(true);
  };

  const handleTwitterShare = () => {
    if (typeof window === 'undefined') return;
    
    const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(`تعلم: ${title}`)}&url=${encodeURIComponent(shareUrl)}&hashtags=kids,islamic,learning`;
    window.open(twitterUrl, '_blank');
    setShared(true);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setShared(true);
      setTimeout(() => setShared(false), 2000);
    } catch (error) {
      console.error('Failed to copy link:', error);
    }
  };

  return (
    <Card className="p-6 bg-gradient-to-r from-brand-gold/10 to-brand-emerald/10 border-brand-gold/20 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-brand-gold">شارك هذا المحتوى</h3>
        {shared && <span className="text-sm text-green-400">تم النسخ! ✓</span>}
      </div>

      <div className="grid gap-3 grid-cols-2 sm:grid-cols-4">
        <Button
          onClick={handleFacebookShare}
          className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
          size="sm"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
          </svg>
          <span className="hidden sm:inline text-xs">Facebook</span>
        </Button>

        <Button
          onClick={handleWhatsAppShare}
          className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white rounded-lg"
          size="sm"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.272-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.67-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.076 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421-7.403h-.004a9.87 9.87 0 00-5.031 1.378c-1.557.821-2.989 2.1-4.087 3.655-1.097 1.556-1.678 3.349-1.678 5.208 0 1.859.581 3.652 1.678 5.208 1.098 1.555 2.53 2.834 4.087 3.655 1.557.821 3.217 1.278 5.031 1.378h.004c1.814 0 3.474-.557 5.031-1.378 1.557-.821 2.989-2.1 4.087-3.655 1.097-1.556 1.678-3.349 1.678-5.208 0-1.859-.581-3.652-1.678-5.208-1.098-1.555-2.53-2.834-4.087-3.655-1.557-.821-3.217-1.278-5.031-1.378" />
          </svg>
          <span className="hidden sm:inline text-xs">WhatsApp</span>
        </Button>

        <Button
          onClick={handleTwitterShare}
          className="flex items-center justify-center gap-2 bg-blue-400 hover:bg-blue-500 text-white rounded-lg"
          size="sm"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M23 3a10.9 10.9 0 01-3.14 1.53 4.48 4.48 0 00-7.86 3v1A10.66 10.66 0 013 4s-4 9 5 13a11.64 11.64 0 01-7 2s9 5 20 5a9.5 9.5 0 00-9-5.5c4.75 2.25 7-7 7-7" />
          </svg>
          <span className="hidden sm:inline text-xs">Twitter</span>
        </Button>

        <Button
          onClick={handleCopyLink}
          className="flex items-center justify-center gap-2 bg-brand-gold hover:bg-brand-gold/90 text-black rounded-lg"
          size="sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.658 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
          </svg>
          <span className="hidden sm:inline text-xs">نسخ</span>
        </Button>
      </div>

      <p className="text-xs text-brand-cream/60 text-right">
        شارك هذا المحتوى الإسلامي المفيد مع أطفالك والعائلة
      </p>
    </Card>
  );
}
