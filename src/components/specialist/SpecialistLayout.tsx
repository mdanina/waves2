import { Outlet } from 'react-router-dom';
import { SpecialistHeader } from './SpecialistHeader';
import { SpecialistSidebar } from './SpecialistSidebar';
import { PendingRecoveryBanner } from './PendingRecoveryBanner';

export function SpecialistLayout() {
  return (
    <div className="flex min-h-screen flex-col">
      <SpecialistHeader />
      <div className="flex flex-1">
        <SpecialistSidebar />
        <main className="flex-1 p-6 bg-gray-50">
          <PendingRecoveryBanner />
          <Outlet />
        </main>
      </div>
    </div>
  );
}
