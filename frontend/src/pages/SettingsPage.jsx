import { PageTransition } from '@/components/layout/PageTransition';
import { UserSettings } from '@/components/user/UserSettings';

export function SettingsPage() {
  return (
    <PageTransition>
      <UserSettings />
    </PageTransition>
  );
}

export default SettingsPage;
