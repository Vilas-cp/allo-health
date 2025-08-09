'use client';

import { useEffect, useState } from 'react';
import API from '../../../lib/api';

export default function DoctorsPage() {
  const [doctors, setDoctors] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', specialization: '', gender: '', location: '', availability: '' });

  const fetchDoctors = async () => {
    const res = await API.get('/doctors');
    setDoctors(res.data);
  };

  useEffect(() => {
    fetchDoctors();
  }, []);

  const addDoctor = async () => {
    await API.post('/doctors', {
      ...form,
      availability: form.availability.split(',').map((s) => s.trim()),
    });
    setForm({ name: '', specialization: '', gender: '', location: '', availability: '' });
    fetchDoctors();
  };

  const viewSchedule = async (id: string) => {
    const res = await API.get(`/doctors/${id}/schedule`);
    const data = res.data;
    if (data.error) return alert(data.error);
    const upcoming =
      data.upcoming
        .map((a: any) => `${new Date(a.timeSlot).toLocaleString()} - ${a.patientName}`)
        .join('\n') || 'No upcoming';
    const status = data.isFreeNow ? 'Free now' : `Busy for ${data.timeUntilFreeMinutes} min`;
    alert(`Doctor: ${data.doctor.name}\nStatus: ${status}\nUpcoming:\n${upcoming}`);
  };

  return (
    <div className='text-black'>
      <h2 className="text-2xl font-bold mb-4">Doctors</h2>
      <div className="mb-4 flex gap-2">
        <input placeholder="Name" className="border p-2" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        <input placeholder="Specialization" className="border p-2" value={form.specialization} onChange={(e) => setForm({ ...form, specialization: e.target.value })} />
        <input placeholder="Gender" className="border p-2" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} />
        <input placeholder="Location" className="border p-2" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        <input placeholder="Availability (comma separated)" className="border p-2" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })} />
        <button onClick={addDoctor} className="bg-green-500 text-white px-4 py-2">Add</button>
      </div>
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
          {doctors.map((doc) => (
            <tr key={doc.id}>
              <td className="p-2">{doc.name}</td>
              <td>{doc.specialization}</td>
              <td>{doc.gender}</td>
              <td>{doc.location}</td>
              <td>{doc.availability.join(', ')}</td>
              <td>
                <button
                  onClick={() => viewSchedule(doc.id)}
                  className="bg-blue-500 text-white px-3 py-1 rounded"
                >
                  View Schedule
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
