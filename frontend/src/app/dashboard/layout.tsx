'use client';

import Link from 'next/link';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-800 text-white p-4">
        <h2 className="text-xl font-bold mb-6">Clinic System</h2>
        <nav className="space-y-2">
          <Link href="/dashboard/doctors" className="block p-2 hover:bg-gray-700 rounded">Doctors</Link>
          <Link href="/dashboard/queue" className="block p-2 hover:bg-gray-700 rounded">Queue</Link>
          <Link href="/dashboard/appointments" className="block p-2 hover:bg-gray-700 rounded">Appointments</Link>
        </nav>
      </aside>
      <main className="flex-1 p-6 bg-gray-100">{children}</main>
    </div>
  );
}
