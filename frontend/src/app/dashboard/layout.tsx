'use client';

import Link from "next/link";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  LayoutDashboard,
  UserRound,
  ListChecks,
  CalendarDays,
  LogOut,
  Activity,
  Stethoscope,
  Building2
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

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
    <div className="flex h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-slate-200 shadow-sm flex flex-col">
        <div className="p-6">
          <div className="flex items-center space-x-3 mb-8">
            <Building2 className="w-8 h-8 text-slate-900" />
            <h2 className="text-xl font-bold text-slate-900">Clinic System</h2>
          </div>
          
          <nav className="space-y-1">
            <Link 
              href="/dashboard/doctors" 
              className="flex items-center space-x-3 p-3 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors group"
            >
              <Stethoscope className="w-5 h-5 text-slate-500 group-hover:text-slate-700" />
              <span>Doctors</span>
            </Link>
            
            <Link 
              href="/dashboard/queue" 
              className="flex items-center space-x-3 p-3 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors group"
            >
              <ListChecks className="w-5 h-5 text-slate-500 group-hover:text-slate-700" />
              <span>Queue</span>
            </Link>
            
            <Link 
              href="/dashboard/appointments" 
              className="flex items-center space-x-3 p-3 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors group"
            >
              <CalendarDays className="w-5 h-5 text-slate-500 group-hover:text-slate-700" />
              <span>Appointments</span>
            </Link>
          </nav>
        </div>

        <div className="mt-auto p-6">
          <Separator className="my-4" />
          <Button 
            onClick={handleLogout}
            variant="ghost"
            className="w-full flex items-center space-x-2 text-red-600 hover:bg-red-50 hover:text-red-700"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign Out</span>
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white border-b border-slate-200 py-4 px-6 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Activity className="w-5 h-5 text-slate-500" />
            <h1 className="text-lg font-semibold text-slate-800">Dashboard Overview</h1>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
              <UserRound className="w-4 h-4 text-slate-600" />
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto p-6 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
}