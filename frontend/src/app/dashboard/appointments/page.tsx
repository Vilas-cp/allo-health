"use client";

import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Plus,
  Calendar,
  Clock,
  User,
  Stethoscope,
  CalendarDays,
  Edit,
  X,
  Save,
  CheckCircle,
  AlertTriangle,
  Loader2,
  Filter,
} from "lucide-react";
import API from "../../../lib/api";
import toast from "react-hot-toast";

export default function AppointmentsPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [appointments, setAppointments] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [filteredAppointments, setFilteredAppointments] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [doctors, setDoctors] = useState<any[]>([]);
  const [form, setForm] = useState({
    patientName: "",
    doctorId: "",
    timeSlot: "",
  });
  const [searchName, setSearchName] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [customDateRange, setCustomDateRange] = useState({
    startDate: "",
    endDate: "",
  });
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const convertToUTCISO = (datetimeLocal: string) => {
    if (!datetimeLocal) return "";
    const date = new Date(datetimeLocal);
    return date.toISOString(); // Converts local time → UTC ISO string
  };

  const fetchAppointments = async (name = "") => {
    setLoading(true);
    try {
      if (name.trim() === "") {
        const res = await API.get("/appointments");
        setAppointments(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          res.data.map((a: any) => ({ ...a, showPicker: false, newTime: "" }))
        );
      } else {
        const res = await API.get("/appointments/search", {
          params: { name },
        });
        setAppointments(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          res.data.map((a: any) => ({ ...a, showPicker: false, newTime: "" }))
        );
      }
    } catch (err) {
      toast.error("Error fetching appointments");
    } finally {
      setLoading(false);
    }
  };

  const fetchDoctors = async () => {
    const res = await API.get("/doctors");
    setDoctors(res.data);
  };

  // Filter appointments by date
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filterAppointmentsByDate = (appointments: any[]) => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const thisWeekStart = new Date(today);
    thisWeekStart.setDate(today.getDate() - today.getDay());
    const thisWeekEnd = new Date(thisWeekStart);
    thisWeekEnd.setDate(thisWeekStart.getDate() + 6);
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    switch (dateFilter) {
      case "today":
        return appointments.filter((appt) => {
          const apptDate = new Date(appt.timeSlot);
          const apptDay = new Date(
            apptDate.getFullYear(),
            apptDate.getMonth(),
            apptDate.getDate()
          );
          return apptDay.getTime() === today.getTime();
        });
      case "tomorrow":
        return appointments.filter((appt) => {
          const apptDate = new Date(appt.timeSlot);
          const apptDay = new Date(
            apptDate.getFullYear(),
            apptDate.getMonth(),
            apptDate.getDate()
          );
          return apptDay.getTime() === tomorrow.getTime();
        });
      case "this-week":
        return appointments.filter((appt) => {
          const apptDate = new Date(appt.timeSlot);
          return apptDate >= thisWeekStart && apptDate <= thisWeekEnd;
        });
      case "this-month":
        return appointments.filter((appt) => {
          const apptDate = new Date(appt.timeSlot);
          return apptDate >= thisMonthStart && apptDate <= thisMonthEnd;
        });
      case "custom":
        if (customDateRange.startDate && customDateRange.endDate) {
          const startDate = new Date(customDateRange.startDate);
          const endDate = new Date(customDateRange.endDate);
          endDate.setHours(23, 59, 59, 999); // Include the entire end date
          return appointments.filter((appt) => {
            const apptDate = new Date(appt.timeSlot);
            return apptDate >= startDate && apptDate <= endDate;
          });
        }
        return appointments;
      case "past":
        return appointments.filter((appt) => {
          const apptDate = new Date(appt.timeSlot);
          return apptDate < now;
        });
      case "upcoming":
        return appointments.filter((appt) => {
          const apptDate = new Date(appt.timeSlot);
          return apptDate >= now;
        });
      default:
        return appointments;
    }
  };

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  // Debounce search input to reduce API calls
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      fetchAppointments(searchName);
    }, 500);
    return () => clearTimeout(delayDebounce);
  }, [searchName]);

  // Filter appointments whenever appointments or filters change
  useEffect(() => {
    const filtered = filterAppointmentsByDate(appointments);
    // Sort by date (most recent first)
    filtered.sort(
      (a, b) => new Date(b.timeSlot).getTime() - new Date(a.timeSlot).getTime()
    );
    setFilteredAppointments(filtered);
  }, [appointments, dateFilter, customDateRange]);

  const bookAppointment = async () => {
    try {
      if (!form.doctorId) {
        toast.error("Please select a doctor before booking.");
        return;
      }
      await API.post("/appointments", {
        ...form,
        timeSlot: convertToUTCISO(form.timeSlot),
      });
      setForm({ patientName: "", doctorId: "", timeSlot: "" });
      setIsDialogOpen(false);

      fetchAppointments(searchName);
    } // eslint-disable-next-line @typescript-eslint/no-explicit-any
     catch (err: any) {

      toast.error(err?.response?.data?.message || "Error booking appointment");
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      const appt = appointments.find((a) => a.id === id);
      if (!appt) return;

      if (status === "Booked") {
        try {
          await API.post("/appointments/check", {
            doctorId: appt.doctor.id,
            timeSlot: appt.timeSlot,
          });
          
        } // eslint-disable-next-line @typescript-eslint/no-explicit-any
        catch (err: any) {
          
          toast.error(
            err?.response?.data?.message || "Time slot is not available"
          );
          return;
        }
      }

      await API.put(`/appointments/${id}/status`, { status });
      fetchAppointments(searchName);
    } // eslint-disable-next-line @typescript-eslint/no-explicit-any
     catch (err: any) {
     
      toast.error(err?.response?.data?.message || "Error updating status");
    }
  };

  const reschedule = async (id: string, newTime: string) => {
    const now = new Date();
    const selected = new Date(newTime);

    if (selected.getTime() < now.getTime()) {
      toast.error("Please select a future time.");
      return;
    }

    try {
      await API.put(`/appointments/${id}/reschedule`, {
        timeSlot: convertToUTCISO(newTime),
      });
      fetchAppointments(searchName);
    } // eslint-disable-next-line @typescript-eslint/no-explicit-any 
    catch (err: any) {
     
      toast.error(
        err?.response?.data?.message || "Error rescheduling appointment"
      );
    }
  };

  const cancel = async (id: string) => {
    try {
      await API.put(`/appointments/${id}/cancel`);
      fetchAppointments(searchName);
    } // eslint-disable-next-line @typescript-eslint/no-explicit-any 
    catch (err: any) {
      
      toast.error(
        err?.response?.data?.message || "Error cancelling appointment"
      );
    }
  };

  // Helper: Convert to datetime-local format
  const formatForInput = (dateStr: string) => {
    const date = new Date(dateStr);
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Booked":
        return "text-blue-700 bg-blue-50 border-blue-200";
      case "Completed":
        return "text-green-700 bg-green-50 border-green-200";
      case "Cancelled":
        return "text-red-700 bg-red-50 border-red-200";
      default:
        return "text-slate-700 bg-slate-50 border-slate-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Booked":
        return <CalendarDays className="w-4 h-4" />;
      case "Completed":
        return <CheckCircle className="w-4 h-4" />;
      case "Cancelled":
        return <AlertTriangle className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const getAppointmentCounts = () => {
    return {
      total: filteredAppointments.length,
      booked: filteredAppointments.filter((a) => a.status === "Booked").length,
      completed: filteredAppointments.filter((a) => a.status === "Completed")
        .length,
      cancelled: filteredAppointments.filter((a) => a.status === "Cancelled")
        .length,
    };
  };

  const counts = getAppointmentCounts();

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">Appointments</h1>
        <p className="text-slate-600">
          Manage patient appointments and schedules
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <Calendar className="w-8 h-8 text-slate-600" />
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {counts.total}
              </p>
              <p className="text-sm text-slate-600">Total Appointments</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <CalendarDays className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {counts.booked}
              </p>
              <p className="text-sm text-slate-600">Booked</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-green-600" />
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {counts.completed}
              </p>
              <p className="text-sm text-slate-600">Completed</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-8 h-8 text-red-600" />
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {counts.cancelled}
              </p>
              <p className="text-sm text-slate-600">Cancelled</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6">
        <div className="p-6">
          <div className="flex flex-col space-y-4">
            {/* Top Row: Search and Add Button */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
              {/* Search */}
              <div className="relative flex-1 lg:max-w-sm">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="search"
                  placeholder="Search patient by name..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent focus:bg-white transition-all duration-200"
                />
              </div>

              {/* Add Appointment Button */}
              <button
                onClick={() => setIsDialogOpen(true)}
                className="inline-flex items-center space-x-2 px-4 py-3 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Book Appointment</span>
              </button>
            </div>

            {/* Date Filters */}
            <div className="border-t border-slate-200 pt-4">
              <div className="flex items-center space-x-2 mb-4">
                <Filter className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">
                  Filter by Date:
                </span>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {[
                  { value: "all", label: "All Appointments" },
                  { value: "today", label: "Today" },
                  { value: "tomorrow", label: "Tomorrow" },
                  { value: "this-week", label: "This Week" },
                  { value: "this-month", label: "This Month" },
                  { value: "upcoming", label: "Upcoming" },
                  { value: "past", label: "Past" },
                  { value: "custom", label: "Custom Range" },
                ].map((filter) => (
                  <button
                    key={filter.value}
                    onClick={() => setDateFilter(filter.value)}
                    className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
                      dateFilter === filter.value
                        ? "bg-slate-900 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                    }`}
                  >
                    {filter.label}
                  </button>
                ))}
              </div>

              {/* Custom Date Range */}
              {dateFilter === "custom" && (
                <div className="flex flex-col sm:flex-row gap-3 p-4 bg-slate-50 rounded-xl">
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      From Date
                    </label>
                    <input
                      type="date"
                      value={customDateRange.startDate}
                      onChange={(e) =>
                        setCustomDateRange((prev) => ({
                          ...prev,
                          startDate: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs font-medium text-slate-600 mb-1">
                      To Date
                    </label>
                    <input
                      type="date"
                      value={customDateRange.endDate}
                      onChange={(e) =>
                        setCustomDateRange((prev) => ({
                          ...prev,
                          endDate: e.target.value,
                        }))
                      }
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left p-4 font-semibold text-slate-900">
                  Patient Name
                </th>
                <th className="text-left p-4 font-semibold text-slate-900">
                  Doctor
                </th>
                <th className="text-left p-4 font-semibold text-slate-900">
                  Date & Time
                </th>
                <th className="text-left p-4 font-semibold text-slate-900">
                  Status
                </th>
                <th className="text-left p-4 font-semibold text-slate-900">
                  Reschedule
                </th>
                <th className="text-left p-4 font-semibold text-slate-900">
                  Actions
                </th>
              </tr>
            </thead>
          </table>
          <div className="max-h-[300px] overflow-y-scroll">
            <table className="w-full">
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8">
                      <div className="flex items-center justify-center space-x-2">
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span className="text-slate-600">
                          Loading appointments...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : filteredAppointments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Calendar className="w-12 h-12 text-slate-300" />
                        <p className="text-slate-600">No appointments found</p>
                        <p className="text-sm text-slate-500">
                          Try adjusting your search or date filters, or book a
                          new appointment
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAppointments.map((appt) => (
                    <tr
                      key={appt.id}
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-slate-600" />
                          </div>
                          <span className="font-medium text-slate-900">
                            {appt.patientName}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                            <Stethoscope className="w-4 h-4 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">
                              {appt.doctor.name}
                            </p>
                            <p className="text-sm text-slate-600">
                              {appt.doctor.specialization}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Clock className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-600">
                            {(() => {
                              const [datePart, timePart] =
                                appt.timeSlot.split("T");
                              const [year, month, day] = datePart.split("-");
                              const [hour, minute, second] = timePart
                                .replace("Z", "")
                                .split(":");
                              return `${day}/${month}/${year}, ${hour}:${minute}:${
                                second.split(".")[0]
                              }`;
                            })()}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <select
                          value={appt.status}
                          onChange={(e) =>
                            updateStatus(appt.id, e.target.value)
                          }
                          className={`inline-flex items-center px-3 py-1.5 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 ${getStatusColor(
                            appt.status
                          )}`}
                        >
                          <option value="Booked">Booked</option>
                          <option value="Completed">Completed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="p-4">
                        {!appt.showPicker ? (
                          <button
                            onClick={() =>
                              setAppointments((prev) =>
                                prev.map((a) =>
                                  a.id === appt.id
                                    ? {
                                        ...a,
                                        showPicker: true,
                                        newTime: formatForInput(appt.timeSlot),
                                      }
                                    : a
                                )
                              )
                            }
                            className="inline-flex items-center space-x-1 px-3 py-1.5 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                          >
                            <Edit className="w-4 h-4" />
                            <span>Reschedule</span>
                          </button>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <input
                              type="datetime-local"
                              value={appt.newTime}
                              onChange={(e) =>
                                setAppointments((prev) =>
                                  prev.map((a) =>
                                    a.id === appt.id
                                      ? { ...a, newTime: e.target.value }
                                      : a
                                  )
                                )
                              }
                              className="px-2 py-1 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-slate-900"
                            />
                            <button
                              onClick={() => reschedule(appt.id, appt.newTime)}
                              className="p-1.5 text-green-600 hover:text-green-700 hover:bg-green-50 rounded-lg transition-colors"
                            >
                              <Save className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() =>
                                setAppointments((prev) =>
                                  prev.map((a) =>
                                    a.id === appt.id
                                      ? { ...a, showPicker: false }
                                      : a
                                  )
                                )
                              }
                              className="p-1.5 text-slate-600 hover:text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="p-4">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="inline-flex items-center space-x-1 px-3 py-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors text-sm font-medium">
                              <X className="w-4 h-4" />
                              <span>Cancel</span>
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Cancel Appointment
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to cancel the appointment
                                for {appt.patientName} with {appt.doctor.name}?
                                This action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>
                                Keep Appointment
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => cancel(appt.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Cancel Appointment
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Book Appointment Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="bg-white max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Book New Appointment</span>
            </AlertDialogTitle>
            <AlertDialogDescription>
              Schedule a new appointment for a patient
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Patient Name
              </label>
              <input
                type="text"
                placeholder="Enter patient name"
                value={form.patientName}
                onChange={(e) =>
                  setForm({ ...form, patientName: e.target.value })
                }
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent focus:bg-white transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Select Doctor
              </label>
              <select
                value={form.doctorId}
                onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent focus:bg-white transition-all duration-200"
              >
                <option value="">Choose a doctor</option>
                {doctors.map((doc) => (
                  <option key={doc.id} value={doc.id}>
                    {doc.name} - {doc.specialization}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Date & Time
              </label>
              <input
                type="datetime-local"
                value={form.timeSlot}
                onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent focus:bg-white transition-all duration-200"
              />
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={bookAppointment}
              disabled={
                !form.patientName.trim() || !form.doctorId || !form.timeSlot
              }
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              Book Appointment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
