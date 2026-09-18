'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { uploadCloudinaryImage } from '@/lib/services/cloudinary';
import { createClient } from '@/lib/supabase/server';

export async function uploadAvatarAction(formData: FormData) {
  const avatarFile = formData.get('avatarFile');
  if (!(avatarFile instanceof File)) {
    throw new Error('يرجى اختيار ملف صورة صالح');
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const upload = await uploadCloudinaryImage({
    file: avatarFile,
    folder: 'zikr/avatars',
    publicId: user.id,
    tags: ['zikr', 'avatar', user.id],
  });

  const { error } = await supabase.from('profiles').upsert({
    id: user.id,
    avatar_url: upload.secureUrl,
    updated_at: new Date().toISOString(),
  });
  if (error) throw error;

  revalidatePath('/profile');
}
