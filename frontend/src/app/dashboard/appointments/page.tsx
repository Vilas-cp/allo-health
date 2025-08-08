'use client';

import { useEffect, useState } from 'react';
import API from '../../../lib/api';

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [form, setForm] = useState({ patientName: '', doctorId: '', timeSlot: '' });

  const fetchAppointments = async () => {
    const res = await API.get('/appointments');
    setAppointments(res.data);
  };

  const fetchDoctors = async () => {
    const res = await API.get('/doctors');
    setDoctors(res.data);
  };

  useEffect(() => {
    fetchAppointments();
    fetchDoctors();
  }, []);

  const bookAppointment = async () => {
    await API.post('/appointments', form);
    setForm({ patientName: '', doctorId: '', timeSlot: '' });
    fetchAppointments();
  };

  const updateStatus = async (id: string, status: string) => {
    await API.put(`/appointments/${id}/status`, { status });
    fetchAppointments();
  };

  const reschedule = async (id: string) => {
    const newTime = prompt('Enter new time slot (YYYY-MM-DDTHH:MM)');
    if (newTime) {
      await API.put(`/appointments/${id}/reschedule`, { timeSlot: newTime });
      fetchAppointments();
    }
  };

  const cancel = async (id: string) => {
    await API.put(`/appointments/${id}/cancel`);
    fetchAppointments();
  };

  return (
    <div className='text-black'>
      <h2 className="text-2xl font-bold mb-4">Appointments</h2>

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
        <button onClick={bookAppointment} className="bg-green-500 text-white px-4 py-2">
          Book
        </button>
      </div>

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
              <td>{appt.timeSlot}</td>
              <td>{appt.status}</td>
              <td className="space-x-2">
                <button
                  className="bg-blue-500 text-white px-2 py-1"
                  onClick={() => updateStatus(appt.id, 'Completed')}
                >
                  Complete
                </button>
                <button
                  className="bg-yellow-500 text-white px-2 py-1"
                  onClick={() => reschedule(appt.id)}
                >
                  Reschedule
                </button>
                <button
                  className="bg-red-500 text-white px-2 py-1"
                  onClick={() => cancel(appt.id)}
                >
                  Cancel
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
