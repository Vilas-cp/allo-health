"use client";

import { useEffect, useState } from "react";
import API from "../../../lib/api";

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: "",
    specialization: "",
    gender: "",
    location: "",
    availability: "",
  });
  const [upcomingMap, setUpcomingMap] = useState<Record<string, boolean>>({});
  const [search, setSearch] = useState("");

  const fetchDoctors = async () => {
    const res = await API.get("/doctors");
    setDoctors(res.data);

    // Check upcoming appointments for each doctor
    const map: Record<string, boolean> = {};
    for (const doc of res.data) {
      try {
        const schedule = await API.get(`/doctors/${doc.id}/schedule`);
        map[doc.id] =
          schedule.data.upcoming && schedule.data.upcoming.length > 0;
      } catch {
        map[doc.id] = false;
      }
    }
    setUpcomingMap(map);
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const addDoctor = async () => {
    await API.post("/doctors", {
      ...form,
      availability: form.availability.split(",").map((s) => s.trim()),
    });
    setForm({
      name: "",
      specialization: "",
      gender: "",
      location: "",
      availability: "",
    });
    fetchDoctors();
  };

  const deleteDoctor = async (id: string) => {
    if (upcomingMap[id]) {
      alert(
        "❌ Cannot delete this doctor because they have upcoming appointments."
      );
      return;
    }
    if (!confirm("Are you sure you want to delete this doctor?")) return;
    await API.delete(`/doctors/${id}`);
    fetchDoctors();
  };

  const viewSchedule = async (id: string) => {
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
  };

  // Filter doctors by search term
  const filteredDoctors = doctors.filter((doc) => {
    const term = search.toLowerCase();
    return (
      doc.name.toLowerCase().includes(term) ||
      doc.specialization.toLowerCase().includes(term) ||
      doc.location.toLowerCase().includes(term)
    );
  });

  return (
    <div className="text-black">
      <h2 className="text-2xl font-bold mb-4">Doctors</h2>

      {/* Search bar */}
      <div className="mb-4 flex gap-2">
        <input
          placeholder="Search by name, specialization, or location"
          className="border p-2 flex-1"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Add Doctor Form */}
      <div className="mb-4 flex gap-2">
        <input
          placeholder="Name"
          className="border p-2"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Specialization"
          className="border p-2"
          value={form.specialization}
          onChange={(e) => setForm({ ...form, specialization: e.target.value })}
        />
        <input
          placeholder="Gender"
          className="border p-2"
          value={form.gender}
          onChange={(e) => setForm({ ...form, gender: e.target.value })}
        />
        <input
          placeholder="Location"
          className="border p-2"
          value={form.location}
          onChange={(e) => setForm({ ...form, location: e.target.value })}
        />
        <input
          placeholder="Availability (comma separated)"
          className="border p-2"
          value={form.availability}
          onChange={(e) =>
            setForm({ ...form, availability: e.target.value })
          }
        />
        <button
          onClick={addDoctor}
          className="bg-green-500 text-white px-4 py-2"
        >
          Add
        </button>
      </div>

      {/* Doctors Table */}
      <table className="w-full bg-white shadow">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2">Name</th>
            <th>Specialization</th>
            <th>Gender</th>
            <th>Location</th>
            <th>Availability</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredDoctors.map((doc) => (
            <tr key={doc.id}>
              <td className="p-2">{doc.name}</td>
              <td>{doc.specialization}</td>
              <td>{doc.gender}</td>
              <td>{doc.location}</td>
              <td>{doc.availability.join(", ")}</td>
              <td className="space-x-2">
                <button
                  onClick={() => viewSchedule(doc.id)}
                  className="bg-blue-500 text-white px-3 py-1 rounded"
                >
                  View Schedule
                </button>
                <button
                  onClick={() => deleteDoctor(doc.id)}
                  disabled={upcomingMap[doc.id]}
                  className={`px-3 py-1 rounded ${
                    upcomingMap[doc.id]
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-red-500 text-white"
                  }`}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}

          {filteredDoctors.length === 0 && (
            <tr>
              <td colSpan={6} className="text-center p-4 text-gray-500">
                No doctors found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
