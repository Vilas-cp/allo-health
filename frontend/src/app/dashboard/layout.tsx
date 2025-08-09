"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      router.replace("/"); 
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.replace("/"); 
  };

  return (
    <div className="flex h-screen">
      <aside className="w-64 bg-gray-800 text-white p-4 flex flex-col justify-between">
        <div>
          <h2 className="text-xl font-bold mb-6">Clinic System</h2>
          <nav className="space-y-2">
            <Link href="/dashboard/doctors" className="block p-2 hover:bg-gray-700 rounded">
              Doctors
            </Link>
            <Link href="/dashboard/queue" className="block p-2 hover:bg-gray-700 rounded">
              Queue
            </Link>
            <Link href="/dashboard/appointments" className="block p-2 hover:bg-gray-700 rounded">
              Appointments
            </Link>
          </nav>
        </div>

        <button
          onClick={handleLogout}
          className="bg-red-600 hover:bg-red-700 transition rounded px-4 py-2 text-white mt-6"
        >
          Sign Out
        </button>
      </aside>

      <main className="flex-1 p-6 bg-gray-100">{children}</main>
    </div>
  );
}
