import { Container } from '@/components/ui/container';
import { AdminControlCenter } from '@/components/admin/admin-control-center';

export const dynamic = 'force-dynamic';

export default function AdminControlPage() {
  return (
    <Container className="py-8">
      <AdminControlCenter />
    </Container>
  );
}
