import { PageTransition } from '@/components/layout/PageTransition';
import { UserProfile } from '@/components/user/UserProfile';

export function ProfilePage() {
  return (
    <PageTransition>
      <UserProfile />
    </PageTransition>
  );
}

export default ProfilePage;
