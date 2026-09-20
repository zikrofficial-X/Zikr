'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { uploadCloudinaryImage } from '@/features/media/services/cloudinary';
import { updateCurrentProfileAvatar } from '@/features/profile/services/profile';
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

  const result = await updateCurrentProfileAvatar(upload.secureUrl);
  if (!result.ok) {
    if (result.error === 'Unauthorized') redirect('/auth/login');
    throw new Error(
      result.error === 'Invalid'
        ? 'رابط الصورة الناتج غير صالح'
        : 'تعذر تحديث صورة الحساب',
    );
  }

  revalidatePath('/profile');
}
