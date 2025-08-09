"use client";

import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Search,
  Plus,
  Filter,
  Clock,
  User,
  AlertTriangle,
  Trash2,
  Users,
  Calendar,
  Activity,
} from "lucide-react";
import API from "../../../lib/api";
import { AlertDescription } from "@/components/ui/alert";

type Priority = "Normal" | "High";
type Status = "Waiting" | "With Doctor" | "Completed";

export default function QueuePage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [queue, setQueue] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<Status | "All">("All");
  const [priorityFilter, setPriorityFilter] = useState<Priority | "All">("All");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [filteredQueue, setFilteredQueue] = useState<any[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newPatientName, setNewPatientName] = useState("");
  const [newPriority, setNewPriority] = useState<Priority>("Normal");
  const [loading, setLoading] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const statusOptions: Status[] = ["Waiting", "With Doctor", "Completed"];

  // Fetch queue from backend
  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await API.get("/queue");
      setQueue(res.data);
    } catch (error) {
      console.error("Failed to fetch queue", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter queue by search term, status, and priority
  useEffect(() => {
    let filtered = queue;

    // Filter by search term
    if (searchTerm.trim()) {
      filtered = filtered.filter((entry) =>
        entry.patientName.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "All") {
      filtered = filtered.filter((entry) => entry.status === statusFilter);
    }

    // Filter by priority
    if (priorityFilter !== "All") {
      filtered = filtered.filter((entry) => entry.priority === priorityFilter);
    }

    setFilteredQueue(filtered);
  }, [searchTerm, statusFilter, priorityFilter, queue]);

  useEffect(() => {
    fetchQueue();
  }, []);

  // Add patient from dialog
  const addPatient = async () => {
    if (!newPatientName.trim()) return;
    try {
      await API.post("/queue", {
        patientName: newPatientName,
        priority: newPriority,
      });
      setIsDialogOpen(false);
      setNewPatientName("");
      setNewPriority("Normal");
      fetchQueue();
    } catch (error) {
      console.error("Failed to add patient");
    }
  };

  // Update status dropdown
  const updateStatus = async (id: string, status: Status) => {
    try {
      await API.put(`/queue/${id}/status`, { status });
      fetchQueue();
    } catch (error) {
      console.error("Failed to update status");
    }
  };

  // Update priority dropdown
  const updatePriority = async (id: string, priority: Priority) => {
    try {
      await API.put(`/queue/${id}/priority`, { priority });
      fetchQueue();
    } catch (error) {
      console.error("Failed to update priority");
    }
  };

  // Delete patient
  const deletePatient = async (id: string) => {
    try {
      await API.delete(`/queue/${id}`);
      setDeleteConfirmId(null);
      fetchQueue();
    } catch (error) {
      console.error("Failed to delete patient");
    }
  };

  const getStatusColor = (status: Status) => {
    switch (status) {
      case "Waiting":
        return "text-amber-700 bg-amber-50 border-amber-200";
      case "With Doctor":
        return "text-blue-700 bg-blue-50 border-blue-200";
      case "Completed":
        return "text-green-700 bg-green-50 border-green-200";
      default:
        return "text-slate-700 bg-slate-50 border-slate-200";
    }
  };

  const getPriorityColor = (priority: Priority) => {
    return priority === "High"
      ? "text-red-700 bg-red-50 border-red-200"
      : "text-slate-700 bg-slate-50 border-slate-200";
  };

  const getFilterCounts = () => {
    return {
      total: queue.length,
      waiting: queue.filter((p) => p.status === "Waiting").length,
      withDoctor: queue.filter((p) => p.status === "With Doctor").length,
      completed: queue.filter((p) => p.status === "Completed").length,
      highPriority: queue.filter((p) => p.priority === "High").length,
    };
  };

  const counts = getFilterCounts();

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      {/* Header Section */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-2">
          Patient Queue
        </h1>
        <p className="text-slate-600">Manage patient flow and appointments</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <Users className="w-8 h-8 text-slate-600" />
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {counts.total}
              </p>
              <p className="text-sm text-slate-600">Total Patients</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <Clock className="w-8 h-8 text-amber-600" />
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {counts.waiting}
              </p>
              <p className="text-sm text-slate-600">Waiting</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <Activity className="w-8 h-8 text-blue-600" />
            <div>
              <p className="text-2xl font-bold text-slate-900">
                {counts.withDoctor}
              </p>
              <p className="text-sm text-slate-600">With Doctor</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
              <div className="w-4 h-4 bg-green-600 rounded-full"></div>
            </div>
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
                {counts.highPriority}
              </p>
              <p className="text-sm text-slate-600">High Priority</p>
            </div>
          </div>
        </div>
      </div>

      {/* Controls Section */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm mb-6">
        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
            {/* Search */}
            <div className="relative flex-1 lg:max-w-sm">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="search"
                placeholder="Search patients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent focus:bg-white transition-all duration-200"
              />
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-4 h-4 text-slate-600" />
                <span className="text-sm font-medium text-slate-700">
                  Filters:
                </span>
              </div>

              <select
                value={statusFilter}
                onChange={(e) =>
                  setStatusFilter(e.target.value as Status | "All")
                }
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
              >
                <option value="All">All Status</option>
                {statusOptions.map((status) => (
                  <option key={status} value={status}>
                    {status}
                  </option>
                ))}
              </select>

              <select
                value={priorityFilter}
                onChange={(e) =>
                  setPriorityFilter(e.target.value as Priority | "All")
                }
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent text-sm"
              >
                <option value="All">All Priority</option>
                <option value="Normal">Normal</option>
                <option value="High">High Priority</option>
              </select>

              <button
                onClick={() => setIsDialogOpen(true)}
                className="inline-flex items-center space-x-2 px-4 py-2 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-colors font-medium shadow-sm"
              >
                <Plus className="w-4 h-4" />
                <span>Add Patient</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left p-4 font-semibold text-slate-900">
                  Queue
                </th>
                <th className="text-left p-4 font-semibold text-slate-900">
                  Patient Name
                </th>
                <th className="text-left p-4 font-semibold text-slate-900">
                  Arrival Time
                </th>
                <th className="text-left p-4 font-semibold text-slate-900">
                  Status
                </th>
                <th className="text-left p-4 font-semibold text-slate-900">
                  Priority
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
                        <div className="w-4 h-4 border-2 border-slate-300 border-t-slate-900 rounded-full animate-spin"></div>
                        <span className="text-slate-600">
                          Loading patients...
                        </span>
                      </div>
                    </td>
                  </tr>
                ) : filteredQueue.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center p-8">
                      <div className="flex flex-col items-center space-y-2">
                        <Users className="w-12 h-12 text-slate-300" />
                        <p className="text-slate-600">No patients found</p>
                        <p className="text-sm text-slate-500">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredQueue.map((entry, index) => (
                    <tr
                      key={entry.id}
                      className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors"
                    >
                      <td className="p-4">
                        <span className="font-semibold text-slate-900">
                          #{entry.queueNumber > 0 ? entry.queueNumber : "-"}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center">
                            <User className="w-4 h-4 text-slate-600" />
                          </div>
                          <span className="font-medium text-slate-900">
                            {entry.patientName}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-slate-500" />
                          <span className="text-slate-600">
                            {new Date(entry.arrivalTime).toLocaleString()}
                          </span>
                        </div>
                      </td>
                      <td className="p-4">
                        <select
                          value={entry.status}
                          onChange={(e) =>
                            updateStatus(entry.id, e.target.value as Status)
                          }
                          className={`px-3 py-1.5 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 ${getStatusColor(
                            entry.status
                          )}`}
                        >
                          {statusOptions.map((status) => (
                            <option key={status} value={status}>
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="p-4">
                        <select
                          value={entry.priority}
                          onChange={(e) =>
                            updatePriority(entry.id, e.target.value as Priority)
                          }
                          className={`px-3 py-1.5 rounded-lg border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-slate-900 ${getPriorityColor(
                            entry.priority
                          )}`}
                        >
                          <option value="Normal">Normal</option>
                          <option value="High">High Priority</option>
                        </select>
                      </td>
                      <td className="p-4">
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <button className="inline-flex items-center space-x-1 px-3 py-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                              <Trash2 className="w-4 h-4" />
                              <span className="text-sm font-medium">
                                Remove
                              </span>
                            </button>
                          </AlertDialogTrigger>
                          <AlertDialogContent className="bg-white">
                            <AlertDialogHeader>
                              <AlertDialogTitle>
                                Remove Patient
                              </AlertDialogTitle>
                              <AlertDescription>
                                Are you sure you want to remove{" "}
                                {entry.patientName} from the queue? This action
                                cannot be undone.
                              </AlertDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deletePatient(entry.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                Remove
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

      {/* Add Patient Dialog */}
      <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <AlertDialogContent className="bg-white max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center space-x-2">
              <Plus className="w-5 h-5" />
              <span>Add New Patient</span>
            </AlertDialogTitle>
            <AlertDescription>
              Enter patient details to add them to the queue
            </AlertDescription>
          </AlertDialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Patient Name
              </label>
              <input
                type="text"
                placeholder="Enter patient name"
                value={newPatientName}
                onChange={(e) => setNewPatientName(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent focus:bg-white transition-all duration-200"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">
                Priority Level
              </label>
              <select
                value={newPriority}
                onChange={(e) => setNewPriority(e.target.value as Priority)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900 focus:border-transparent focus:bg-white transition-all duration-200"
              >
                <option value="Normal">Normal Priority</option>
                <option value="High">High Priority</option>
              </select>
            </div>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={addPatient}
              disabled={!newPatientName.trim()}
              className="bg-slate-900 hover:bg-slate-800 text-white"
            >
              Add Patient
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
