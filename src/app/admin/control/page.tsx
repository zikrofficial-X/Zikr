import { Container } from '@/components/ui/container';
import { AdminPlatformCommandCenter } from '@/features/admin/components/admin-platform-command-center';

export const dynamic = 'force-dynamic';

export default function AdminControlPage() {
  return (
    <Container className="py-8">
      <AdminPlatformCommandCenter />
    </Container>
  );
}
