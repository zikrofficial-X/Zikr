'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';

export default function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <Button
      onClick={handleCopy}
      variant={copied ? 'primary' : 'outline'}
      className={`min-w-[140px] transition-all ${copied ? 'bg-green-600 border-green-600 text-white' : 'border-brand-gold/30 text-brand-gold'}`}
    >
      {copied ? '✓ تم النسخ' : 'نسخ الدعاء 📋'}
    </Button>
  );
}
