"use client";

import { useEffect, useState } from "react";
import API from "../../../lib/api";

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [form, setForm] = useState({
    patientName: "",
    doctorId: "",
    timeSlot: "",
  });

  const fetchAppointments = async () => {
    const res = await API.get("/appointments");
    setAppointments(
      res.data.map((a: any) => ({ ...a, showPicker: false, newTime: "" }))
    );
  };

  const fetchDoctors = async () => {
    const res = await API.get("/doctors");
    setDoctors(res.data);
  };

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  const bookAppointment = async () => {
    try {
      if (!form.doctorId) {
        alert("Please select a doctor before booking.");
        return;
      }
      await API.post("/appointments", form);
      setForm({ patientName: "", doctorId: "", timeSlot: "" });
      fetchAppointments();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Error booking appointment");
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
        } catch (err: any) {
          alert(err?.response?.data?.message || "Time slot is not available");
          return;
        }
      }

      await API.put(`/appointments/${id}/status`, { status });
      fetchAppointments();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Error updating status");
    }
  };

  const reschedule = async (id: string, newTime: string) => {
    const now = new Date();
    const selected = new Date(newTime);

    if (selected.getTime() < now.getTime()) {
      alert("Please select a future time.");
      return;
    }

    try {
      await API.put(`/appointments/${id}/reschedule`, { timeSlot: newTime });
      fetchAppointments();
    } catch (err: any) {
      alert(err?.response?.data?.message || "Error rescheduling appointment");
    }
  };

  const cancel = async (id: string) => {
    await API.put(`/appointments/${id}/cancel`);
    fetchAppointments();
  };

  // Helper: Convert to datetime-local format
  const formatForInput = (dateStr: string) => {
    const date = new Date(dateStr);
    const tzOffset = date.getTimezoneOffset() * 60000;
    return new Date(date.getTime() - tzOffset).toISOString().slice(0, 16);
  };

  return (
    <div className="text-black">
      <h2 className="text-2xl font-bold mb-4">Appointments</h2>

      {/* Booking Form */}
      <div className="mb-4 flex gap-2">
        <input
          placeholder="Patient Name"
          className="border p-2"
          value={form.patientName}
          onChange={(e) => setForm({ ...form, patientName: e.target.value })}
        />
        <select
          className="border p-2"
          value={form.doctorId}
          onChange={(e) => setForm({ ...form, doctorId: e.target.value })}
        >
          <option value="">Select Doctor</option>
          {doctors.map((doc) => (
            <option key={doc.id} value={doc.id}>
              {doc.name} - {doc.specialization}
            </option>
          ))}
        </select>
        <input
          type="datetime-local"
          className="border p-2"
          value={form.timeSlot}
          onChange={(e) => setForm({ ...form, timeSlot: e.target.value })}
        />
        <button
          onClick={bookAppointment}
          className="bg-green-500 text-white px-4 py-2"
        >
          Book
        </button>
      </div>

      {/* Appointment Table */}
      <table className="w-full bg-white shadow">
        <thead>
          <tr className="bg-gray-200">
            <th>Patient</th>
            <th>Doctor</th>
            <th>Time Slot</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((appt) => (
            <tr key={appt.id}>
              <td>{appt.patientName}</td>
              <td>{appt.doctor.name}</td>
              <td>{new Date(appt.timeSlot).toLocaleString()}</td>
              <td>
                <select
                  className="border p-1"
                  value={appt.status}
                  onChange={(e) => updateStatus(appt.id, e.target.value)}
                >
                  <option value="Booked">Booked</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </td>
              <td className="flex gap-2">
                {!appt.showPicker ? (
                  <button
                    className="bg-yellow-500 text-white px-2 py-1"
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
                  >
                    Reschedule
                  </button>
                ) : (
                  <>
                    <input
                      type="datetime-local"
                      className="border p-1"
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
                    />
                    <button
                      className="bg-green-500 text-white px-2 py-1"
                      onClick={() => reschedule(appt.id, appt.newTime)}
                    >
                      Save
                    </button>
                    <button
                      className="bg-gray-500 text-white px-2 py-1"
                      onClick={() =>
                        setAppointments((prev) =>
                          prev.map((a) =>
                            a.id === appt.id ? { ...a, showPicker: false } : a
                          )
                        )
                      }
                    >
                      Cancel
                    </button>
                  </>
                )}
                <button
                  className="bg-red-500 text-white px-2 py-1"
                  onClick={() => cancel(appt.id)}
                >
                  Cancel Appointment
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
