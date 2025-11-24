import { PageTransition } from '@/components/layout/PageTransition';
import { AdminDashboard } from '@/components/user/AdminDashboard';

export function AdminPage() {
  return (
    <PageTransition>
      <AdminDashboard />
    </PageTransition>
  );
}

export default AdminPage;
