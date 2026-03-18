import { Outlet } from 'react-router-dom';

import { BottomNav } from '@/components/layout/BottomNav';
import { Topbar } from '@/components/layout/Topbar';
import { useAuth } from '@/hooks/useAuth';
import { useTasks } from '@/hooks/useTasks';

export default function AppLayout() {
  const { user, authLoading } = useAuth();
  const { streak } = useTasks(user?.id);

  return (
    <div>
      <Topbar
        loading={authLoading || !streak}
        day={streak?.current_day}
        streak={streak?.current_streak}
        xp={streak?.total_xp}
        unread={0}
      />
      <Outlet />
      <BottomNav />
    </div>
  );
}
