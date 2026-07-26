import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import DemoStrip from './DemoStrip';

export default function AppLayout() {
  return (
    <div className="grid grid-cols-[224px_1fr] min-h-screen">
      <Sidebar />
      <div>
        <Topbar />
        <DemoStrip />
        <main className="p-6 max-w-[1440px]">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
