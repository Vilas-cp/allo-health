'use client';

import { useEffect, useState } from 'react';
import API from '../../../lib/api';

export default function QueuePage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [patientName, setPatientName] = useState('');
  const [priority, setPriority] = useState<'Normal' | 'High'>('Normal');

  const fetchQueue = async () => {
    const res = await API.get('/queue');
    setQueue(res.data);
  };

  useEffect(() => {
    fetchQueue();
  }, []);

  const addPatient = async () => {
    if (!patientName.trim()) return;
    await API.post('/queue', { patientName, priority });
    setPatientName('');
    setPriority('Normal');
    fetchQueue();
  };

  const updateStatus = async (id: string, status: string) => {
    await API.put(`/queue/${id}/status`, { status });
    fetchQueue();
  };

  const deletePatient = async (id: string) => {
    if (!confirm('Remove this patient from queue?')) return;
    await API.delete(`/queue/${id}`);
    fetchQueue();
  };

  const togglePriority = async (id: string, current: 'Normal' | 'High') => {
    const newPriority = current === 'Normal' ? 'High' : 'Normal';
    await API.put(`/queue/${id}/priority`, { priority: newPriority });
    fetchQueue();
  };

  return (
    <div className='text-black'>
      <h2 className="text-2xl font-bold mb-4">Queue Management</h2>
      <div className="mb-4 flex gap-2">
        <input
          placeholder="Patient Name"
          className="border p-2"
          value={patientName}
          onChange={(e) => setPatientName(e.target.value)}
        />
        <select
          className="border p-2"
          value={priority}
          onChange={(e) => setPriority(e.target.value as 'Normal' | 'High')}
        >
          <option value="Normal">Normal</option>
          <option value="High">High Priority</option>
        </select>
        <button onClick={addPatient} className="bg-green-500 text-white px-4 py-2">
          Add to Queue
        </button>
      </div>

      <table className="w-full bg-white shadow">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2">Queue #</th>
            <th>Patient</th>
            <th>Arrival</th>
            <th>Status</th>
            <th>Priority</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {queue.map((entry) => (
            <tr key={entry.id}>
              <td className="p-2">{entry.queueNumber > 0 ? entry.queueNumber : '-'}</td>
              <td>{entry.patientName}</td>
              <td>{new Date(entry.arrivalTime).toLocaleString()}</td>
              <td>{entry.status}</td>
              <td>{entry.priority}</td>
              <td className="space-x-2">
                <button
                  className="bg-blue-500 text-white px-2 py-1"
                  onClick={() => updateStatus(entry.id, 'With Doctor')}
                >
                  With Doctor
                </button>
                <button
                  className="bg-green-500 text-white px-2 py-1"
                  onClick={() => updateStatus(entry.id, 'Completed')}
                >
                  Completed
                </button>
                <button
                  className="bg-yellow-500 text-white px-2 py-1"
                  onClick={() => togglePriority(entry.id, entry.priority)}
                >
                  Toggle Priority
                </button>
                <button
                  className="bg-red-500 text-white px-2 py-1"
                  onClick={() => deletePatient(entry.id)}
                >
                  Remove
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
