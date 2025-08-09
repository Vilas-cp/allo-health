"use client";

import { useEffect, useState } from "react";
import API from "../../../lib/api";

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

type DoctorForm = {
  name: string;
  specialization: string;
  gender: string;
  location: string;
  availability: string[];
  workingHours: Record<
    string,
    { start: string; end: string } // time picker format
  >;
};

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [upcomingMap, setUpcomingMap] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  const [form, setForm] = useState<DoctorForm>({
    name: "",
    specialization: "",
    gender: "",
    location: "",
    availability: [],
    workingHours: {},
  });

  const [editingDoctorId, setEditingDoctorId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<DoctorForm>({
    name: "",
    specialization: "",
    gender: "",
    location: "",
    availability: [],
    workingHours: {},
  });

  // Convert backend workingHours string "09:00-17:00" to {start,end} object
  const parseWorkingHours = (
    wh: Record<string, string>
  ): Record<string, { start: string; end: string }> => {
    const parsed: Record<string, { start: string; end: string }> = {};
    for (const day in wh) {
      const parts = wh[day].split("-");
      parsed[day] = {
        start: parts[0] || "",
        end: parts[1] || "",
      };
    }
    return parsed;
  };

  // Convert {start,end} object to backend string format "09:00-17:00"
  const serializeWorkingHours = (
    wh: Record<string, { start: string; end: string }>
  ): Record<string, string> => {
    const serialized: Record<string, string> = {};
    for (const day in wh) {
      if (wh[day].start && wh[day].end) {
        serialized[day] = `${wh[day].start}-${wh[day].end}`;
      }
    }
    return serialized;
  };

  // Fetch doctors + parse working hours to {start,end} format
  const fetchDoctors = async () => {
    try {
      const res = await API.get("/doctors");
      const docs = res.data.map((doc: any) => ({
        ...doc,
        workingHours: parseWorkingHours(doc.workingHours || {}),
      }));
      setDoctors(docs);

      const map: Record<string, boolean> = {};
      await Promise.all(
        docs.map(async (doc: any) => {
          try {
            const schedule = await API.get(`/doctors/${doc.id}/schedule`);
            map[doc.id] = schedule.data.upcoming?.length > 0;
          } catch {
            map[doc.id] = false;
          }
        })
      );
      setUpcomingMap(map);
    } catch (error) {
      console.error("Failed to fetch doctors", error);
    }
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  // Toggle day availability + clear working hours if unchecked
  const toggleDay = (
    day: string,
    currentAvailability: string[],
    currentWorkingHours: Record<string, { start: string; end: string }>,
    setAvailability: (arr: string[]) => void,
    setWorkingHours: (wh: Record<string, { start: string; end: string }>) => void
  ) => {
    if (currentAvailability.includes(day)) {
      setAvailability(currentAvailability.filter((d) => d !== day));
      const newWH = { ...currentWorkingHours };
      delete newWH[day];
      setWorkingHours(newWH);
    } else {
      setAvailability([...currentAvailability, day]);
    }
  };

  // Validate form data
  const validateForm = (data: DoctorForm) => {
    if (!data.name.trim()) {
      alert("Please enter doctor's name");
      return false;
    }
    for (const day of data.availability) {
      const wh = data.workingHours[day];
      if (
        !wh ||
        !wh.start ||
        !wh.end ||
        wh.start >= wh.end // start must be before end
      ) {
        alert(
          `Please enter valid start and end times for ${day} (start must be before end)`
        );
        return false;
      }
    }
    return true;
  };

  // Add doctor
  const addDoctor = async () => {
    if (!validateForm(form)) return;
    try {
      await API.post("/doctors", {
        ...form,
        workingHours: serializeWorkingHours(form.workingHours),
      });
      setForm({
        name: "",
        specialization: "",
        gender: "",
        location: "",
        availability: [],
        workingHours: {},
      });
      fetchDoctors();
    } catch (error) {
      alert("Failed to add doctor");
      console.error(error);
    }
  };

  // Delete doctor
  const deleteDoctor = async (id: string) => {
    if (
      !confirm(
        "Are you sure you want to delete this doctor? His future appointments will also be deleted if you delete the doctor."
      )
    )
      return;
    try {
      await API.delete(`/doctors/${id}`);
      fetchDoctors();
    } catch (error) {
      alert("Failed to delete doctor");
      console.error(error);
    }
  };

  // View schedule
  const viewSchedule = async (id: string) => {
    try {
      const res = await API.get(`/doctors/${id}/schedule`);
      const data = res.data;
      if (data.error) return alert(data.error);
      const upcoming =
        data.upcoming
          .map(
            (a: any) =>
              `${new Date(a.timeSlot).toLocaleString()} - ${a.patientName}`
          )
          .join("\n") || "No upcoming";
      const status = data.isFreeNow
        ? "Free now"
        : `Busy for ${data.timeUntilFreeMinutes} min`;
      alert(
        `Doctor: ${data.doctor.name}\nStatus: ${status}\nUpcoming:\n${upcoming}`
      );
    } catch {
      alert("Failed to fetch schedule");
    }
  };

  // Start editing - convert workingHours to {start,end}
  const startEdit = (doc: any) => {
    setEditingDoctorId(doc.id);
    setEditForm({
      name: doc.name,
      specialization: doc.specialization,
      gender: doc.gender,
      location: doc.location,
      availability: doc.availability || [],
      workingHours: doc.workingHours || {},
    });
  };

  const cancelEdit = () => {
    setEditingDoctorId(null);
  };

  // Save edited doctor
  const saveDoctor = async () => {
    if (!editingDoctorId) return;
    if (!validateForm(editForm)) return;
    try {
      await API.put(`/doctors/${editingDoctorId}`, {
        ...editForm,
        workingHours: serializeWorkingHours(editForm.workingHours),
      });
      setEditingDoctorId(null);
      fetchDoctors();
    } catch (error) {
      alert("Failed to update doctor");
      console.error(error);
    }
  };

  // Filter doctors by search
  const filteredDoctors = doctors.filter((doc) => {
    const term = search.toLowerCase();
    return (
      doc.name.toLowerCase().includes(term) ||
      doc.specialization.toLowerCase().includes(term) ||
      doc.location.toLowerCase().includes(term)
    );
  });

  // Availability + time picker inputs for Add/Edit forms
  const AvailabilityHoursInput = ({
    availability,
    workingHours,
    setAvailability,
    setWorkingHours,
  }: {
    availability: string[];
    workingHours: Record<string, { start: string; end: string }>;
    setAvailability: (arr: string[]) => void;
    setWorkingHours: (wh: Record<string, { start: string; end: string }>) => void;
  }) => {
    return (
      <>
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <span className="font-medium">Availability:</span>
          {daysOfWeek.map((day) => (
            <label
              key={day}
              className="inline-flex items-center gap-1 cursor-pointer select-none"
            >
              <input
                type="checkbox"
                checked={availability.includes(day)}
                onChange={() =>
                  toggleDay(day, availability, workingHours, setAvailability, setWorkingHours)
                }
              />
              {day}
            </label>
          ))}
        </div>

        <div className="grid  max-w-md">
          {availability.map((day) => (
            <div key={day} className="flex items-center gap-2 pt-2">
              <label className="w-20">{day}:</label>
              <input
                type="time"
                className="border p-1 rounded flex-1"
                value={workingHours[day]?.start || ""}
                onChange={(e) =>
                  setWorkingHours({
                    ...workingHours,
                    [day]: {
                      start: e.target.value,
                      end: workingHours[day]?.end || "",
                    },
                  })
                }
              />
              <span className="font-semibold">to</span>
              <input
                type="time"
                className="border p-1 rounded flex-1"
                value={workingHours[day]?.end || ""}
                onChange={(e) =>
                  setWorkingHours({
                    ...workingHours,
                    [day]: {
                      start: workingHours[day]?.start || "",
                      end: e.target.value,
                    },
                  })
                }
              />
            </div>
          ))}
        </div>
      </>
    );
  };

  return (
    <div className="text-black p-4 relative">
      <h2 className="text-2xl font-bold mb-4">Doctors</h2>

      {/* Search bar */}
      <div className="mb-4 flex gap-2">
        <input
          placeholder="Search by name, specialization, or location"
          className="border p-2 flex-1 rounded"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Add Doctor Form */}
      <div className="mb-6 border p-4 rounded shadow space-y-3 max-w-4xl">
        <h3 className="font-semibold text-lg">Add New Doctor</h3>
        <div className="flex flex-wrap gap-2">
          <input
            placeholder="Name"
            className="border p-2 flex-1 rounded"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            placeholder="Specialization"
            className="border p-2 flex-1 rounded"
            value={form.specialization}
            onChange={(e) =>
              setForm({ ...form, specialization: e.target.value })
            }
          />
          <input
            placeholder="Gender"
            className="border p-2 flex-1 rounded"
            value={form.gender}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
          />
          <input
            placeholder="Location"
            className="border p-2 flex-1 rounded"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
        </div>

        <AvailabilityHoursInput
          availability={form.availability}
          workingHours={form.workingHours}
          setAvailability={(arr) =>
            setForm((prev) => ({ ...prev, availability: arr }))
          }
          setWorkingHours={(wh) =>
            setForm((prev) => ({ ...prev, workingHours: wh }))
          }
        />

        <button
          onClick={addDoctor}
          className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 transition"
        >
          Add Doctor
        </button>
      </div>

      {/* Doctors Table */}
      <table className="w-full bg-white shadow rounded overflow-hidden max-w-7xl mx-auto">
        <thead>
          <tr className="bg-gray-200 text-left">
            <th className="p-2">Name</th>
            <th>Status</th>
            <th>Specialization</th>
            <th>Gender</th>
            <th>Location</th>
            <th>Availability</th>
            <th className="text-center">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredDoctors.length === 0 && (
            <tr>
              <td colSpan={7} className="text-center p-4 text-gray-600">
                No doctors found.
              </td>
            </tr>
          )}

          {filteredDoctors.map((doc) => (
            <tr key={doc.id} className="border-t">
              <td className="p-2">{doc.name}</td>
              <td className="p-2">
                <span
                  className={`px-2 py-1 rounded text-white ${
                    doc.status === "Available"
                      ? "bg-green-600"
                      : doc.status === "Busy"
                      ? "bg-yellow-500"
                      : "bg-red-600"
                  }`}
                >
                  {doc.status}
                </span>
                <div className="text-xs text-gray-600">{doc.nextAvailable}</div>
              </td>
              <td className="p-2">{doc.specialization}</td>
              <td className="p-2">{doc.gender}</td>
              <td className="p-2">{doc.location}</td>
              <td className="p-2 max-w-xs text-sm text-gray-700">
                {doc.availability
                  .map(
                    (day: string) =>
                      `${day}: ${
                        doc.workingHours?.[day]
                          ? `${doc.workingHours[day].start} - ${doc.workingHours[day].end}`
                          : "N/A"
                      }`
                  )
                  .join(", ")}
              </td>
              <td className="p-2 space-x-2 text-center whitespace-nowrap">
                <button
                  onClick={() => viewSchedule(doc.id)}
                  className="bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700 transition"
                >
                  View Schedule
                </button>
                <button
                  onClick={() => startEdit(doc)}
                  className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600 transition"
                >
                  Edit
                </button>
                <button
                  onClick={() => deleteDoctor(doc.id)}
                  className="px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700 transition"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Edit Modal */}
      {editingDoctorId && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-40"
            onClick={cancelEdit}
          />
          <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
            <div
              className="bg-white rounded shadow max-w-3xl w-full p-6 relative overflow-y-auto max-h-[90vh]"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-semibold text-xl mb-4">Edit Doctor</h3>
              <div className="flex flex-wrap gap-2 mb-4">
                <input
                  placeholder="Name"
                  className="border p-2 flex-1 rounded"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, name: e.target.value }))
                  }
                />
                <input
                  placeholder="Specialization"
                  className="border p-2 flex-1 rounded"
                  value={editForm.specialization}
                  onChange={(e) =>
                    setEditForm((prev) => ({
                      ...prev,
                      specialization: e.target.value,
                    }))
                  }
                />
                <input
                  placeholder="Gender"
                  className="border p-2 flex-1 rounded"
                  value={editForm.gender}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, gender: e.target.value }))
                  }
                />
                <input
                  placeholder="Location"
                  className="border p-2 flex-1 rounded"
                  value={editForm.location}
                  onChange={(e) =>
                    setEditForm((prev) => ({ ...prev, location: e.target.value }))
                  }
                />
              </div>

              <AvailabilityHoursInput
                availability={editForm.availability}
                workingHours={editForm.workingHours}
                setAvailability={(arr) =>
                  setEditForm((prev) => ({ ...prev, availability: arr }))
                }
                setWorkingHours={(wh) =>
                  setEditForm((prev) => ({ ...prev, workingHours: wh }))
                }
              />

              <div className="flex justify-end gap-2 mt-6">
                <button
                  onClick={saveDoctor}
                  className="bg-green-600 text-white px-5 py-2 rounded hover:bg-green-700 transition"
                >
                  Save
                </button>
                <button
                  onClick={cancelEdit}
                  className="bg-gray-400 text-white px-5 py-2 rounded hover:bg-gray-500 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
