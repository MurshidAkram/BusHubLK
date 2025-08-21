// src/pages/dashboards/admin/RouteFaresPage.tsx
import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AppContext } from '../../../context/AppContext';
import { toast } from 'react-toastify';

type Stop = {
  stop_id?: number;
  route_id?: number | string;
  sequence_no: number;
  halt_name: string;
  distance_from_start_km?: number | null;
  charge: number;
};

const RouteFaresPage: React.FC = () => {
  const { routeId } = useParams<{ routeId: string }>();
  const navigate = useNavigate();
  const context = useContext(AppContext) as any;
  const token = context?.token;

  const [routeName, setRouteName] = useState<string>('');
  const [stops, setStops] = useState<Stop[]>([]);
  const [loading, setLoading] = useState(false);
  const [savingAll, setSavingAll] = useState(false);

  // Add-stop form state
  const [newStop, setNewStop] = useState<Stop>({
    sequence_no: 1,
    halt_name: '',
    distance_from_start_km: null,
    charge: 0,
  });

  useEffect(() => {
    if (!routeId) return;
    fetchRoute();
    fetchStops();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routeId]);

  // Debug helper to log fetch results
  const safeJson = async (res: Response) => {
    const text = await res.text();
    try {
      return JSON.parse(text);
    } catch {
      return text;
    }
  };

  const fetchRoute = async () => {
    try {
      const res = await fetch(`http://localhost:5000/api/routes/${routeId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        console.warn('fetchRoute failed', res.status);
        return;
      }
      const data = await res.json();
      setRouteName(data.route?.route_name || '');
    } catch (err) {
      console.error('fetchRoute error', err);
    }
  };

  const fetchStops = async () => {
    setLoading(true);
    try {
      console.log(`GET /api/routes/${routeId}/stops (token? ${!!token})`);
      const res = await fetch(`http://localhost:5000/api/routes/${routeId}/stops`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const raw = await safeJson(res);
      console.log('GET stops response', res.status, raw);
      if (!res.ok) {
        toast.error(`Failed to load stops (${res.status})`);
        setStops([]);
        return;
      }
      const data = typeof raw === 'object' && raw ? raw : { stops: [] };
      const normalized: Stop[] = (data.stops || []).map((s: any) => ({
        stop_id: s.stop_id,
        route_id: s.route_id,
        sequence_no: s.sequence_no ?? 0,
        halt_name: s.halt_name ?? '',
        distance_from_start_km: s.distance_from_start_km ?? null,
        charge: typeof s.charge === 'number' ? s.charge : Number(s.charge ?? 0),
      }));
      setStops(normalized);
      // Suggest default next sequence for add form
      setNewStop((prev) => ({ ...prev, sequence_no: (normalized.length || 0) + 1 }));
    } catch (err) {
      console.error('fetchStops error', err);
      toast.error('Error fetching stops. See console.');
      setStops([]);
    } finally {
      setLoading(false);
    }
  };

  const updateChargeLocal = (stopId: number | undefined, value: string) => {
    setStops((prev) =>
      prev.map((s) =>
        s.stop_id === stopId ? { ...s, charge: value === '' ? 0 : Number(value) } : s
      )
    );
  };

  // save only charge by default (backend often expects partial)
  const saveStop = async (stop: Stop) => {
    if (!stop.stop_id) return toast.error('Stop has no id');
    if (stop.charge < 0) return toast.error('Charge cannot be negative');
    try {
      console.log('PUT stop', stop.stop_id, { charge: stop.charge });
      const res = await fetch(`http://localhost:5000/api/routes/${routeId}/stops/${stop.stop_id}`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        // send only charge (change to JSON.stringify(stop) if your API needs full object)
        body: JSON.stringify({ charge: stop.charge }),
      });
      const raw = await safeJson(res);
      console.log('PUT response', res.status, raw);
      if (!res.ok) throw new Error('Failed updating stop');
      toast.success(`Saved: ${stop.halt_name}`);
      await fetchStops(); // refresh
    } catch (err) {
      console.error('saveStop error', err);
      toast.error(`Error saving ${stop.halt_name}`);
    }
  };

  const deleteStop = async (stopId?: number) => {
    if (!stopId) return;
    if (!window.confirm('Delete this stop?')) return;
    try {
      const res = await fetch(`http://localhost:5000/api/routes/${routeId}/stops/${stopId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const raw = await safeJson(res);
      console.log('DELETE response', res.status, raw);
      if (!res.ok) throw new Error('Failed delete');
      toast.success('Stop deleted');
      await fetchStops();
    } catch (err) {
      console.error('deleteStop error', err);
      toast.error('Error deleting stop');
    }
  };

  const handleSaveAll = async () => {
    if (stops.length === 0) return;
    setSavingAll(true);
    try {
      const requests = stops
        .filter((s) => s.stop_id)
        .map((s) =>
          fetch(`http://localhost:5000/api/routes/${routeId}/stops/${s.stop_id}`, {
            method: 'PUT',
            headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({ charge: s.charge }),
          }).then(async (res) => {
            const raw = await safeJson(res);
            if (!res.ok) throw new Error(`Failed: ${s.halt_name} (${res.status}) - ${JSON.stringify(raw)}`);
            return raw;
          })
        );

      await Promise.all(requests);
      toast.success('All fares saved');
      await fetchStops();
    } catch (err) {
      console.error('handleSaveAll error', err);
      toast.error('Error saving fares (some may have failed). See console.');
    } finally {
      setSavingAll(false);
    }
  };

  // --- create new stop (POST)
  const createStop = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newStop.halt_name) return toast.error('Enter halt name');
    if (newStop.sequence_no < 1) return toast.error('Sequence must be >= 1');
    try {
      console.log('POST create stop', newStop);
      const res = await fetch(`http://localhost:5000/api/routes/${routeId}/stops`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(newStop),
      });
      const raw = await safeJson(res);
      console.log('POST response', res.status, raw);
      if (!res.ok) throw new Error('Failed create');
      toast.success('Stop created');
      // reset add form
      setNewStop({ sequence_no: (stops.length || 0) + 1, halt_name: '', distance_from_start_km: null, charge: 0 });
      await fetchStops();
    } catch (err) {
      console.error('createStop error', err);
      toast.error('Error creating stop. See console.');
    }
  };

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Manage Fares</h1>
          <p className="text-sm text-gray-600">{routeName || `Route ${routeId}`}</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate(-1)} className="px-3 py-1 bg-gray-200 rounded">Back</button>
          <button
            onClick={handleSaveAll}
            disabled={savingAll}
            className="px-3 py-1 bg-green-600 text-white rounded disabled:opacity-50"
          >
            {savingAll ? 'Saving...' : 'Save All'}
          </button>
        </div>
      </div>

      {/* Add Stop form */}
      <div className="bg-white rounded shadow p-4">
        <h3 className="font-medium mb-2">Add New Stop</h3>
        <form onSubmit={createStop} className="grid grid-cols-1 md:grid-cols-6 gap-3 items-end">
          <div className="md:col-span-1">
            <label className="block text-xs text-gray-600">Seq</label>
            <input
              name="sequence_no"
              type="number"
              min={1}
              value={newStop.sequence_no ?? ''}
              onChange={(e) => setNewStop((p) => ({ ...p, sequence_no: Number(e.target.value) }))}
              className="w-full border px-2 py-1 rounded"
            />
          </div>
          <div className="md:col-span-3">
            <label className="block text-xs text-gray-600">Halt Name</label>
            <input
              name="halt_name"
              value={newStop.halt_name}
              onChange={(e) => setNewStop((p) => ({ ...p, halt_name: e.target.value }))}
              className="w-full border px-2 py-1 rounded"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs text-gray-600">Distance (km)</label>
            <input
              name="distance_from_start_km"
              type="number"
              step="0.01"
              value={newStop.distance_from_start_km ?? ''}
              onChange={(e) => setNewStop((p) => ({ ...p, distance_from_start_km: e.target.value === '' ? null : Number(e.target.value) }))}
              className="w-full border px-2 py-1 rounded"
            />
          </div>
          <div className="md:col-span-1">
            <label className="block text-xs text-gray-600">Fare (Rs)</label>
            <input
              name="charge"
              type="number"
              min={0}
              step="0.01"
              value={newStop.charge ?? 0}
              onChange={(e) => setNewStop((p) => ({ ...p, charge: Number(e.target.value) }))}
              className="w-full border px-2 py-1 rounded"
            />
          </div>

          <div className="md:col-span-6 flex gap-2 mt-2">
            <button type="submit" className="bg-blue-600 text-white px-4 py-1 rounded">Create Stop</button>
            <button type="button" onClick={() => setNewStop({ sequence_no: (stops.length || 0) + 1, halt_name: '', distance_from_start_km: null, charge: 0 })} className="bg-gray-200 px-4 py-1 rounded">Reset</button>
          </div>
        </form>
      </div>

      <div className="bg-white rounded shadow p-4">
        <h3 className="font-medium mb-2">Stops & Fares</h3>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="p-2 text-left">#</th>
                  <th className="p-2 text-left">Halt</th>
                  <th className="p-2 text-right">Distance (km)</th>
                  <th className="p-2 text-right">Fare (Rs)</th>
                  <th className="p-2 text-center">Actions</th>
                </tr>
              </thead>
              <tbody>
                {stops.map((s) => (
                  <tr key={s.stop_id ?? `${s.sequence_no}-${s.halt_name}`} className="border-b">
                    <td className="p-2">{s.sequence_no}</td>
                    <td className="p-2">{s.halt_name}</td>
                    <td className="p-2 text-right">{s.distance_from_start_km ?? '-'}</td>
                    <td className="p-2 text-right">
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={Number(s.charge ?? 0)}
                        onChange={(e) => updateChargeLocal(s.stop_id, e.target.value)}
                        className="w-24 border px-2 py-1 rounded text-right"
                      />
                    </td>
                    <td className="p-2 text-center">
                      <button onClick={() => saveStop(s)} className="mr-2 text-blue-600 hover:underline">Save</button>
                      <button onClick={() => deleteStop(s.stop_id)} className="text-red-600 hover:underline">Delete</button>
                    </td>
                  </tr>
                ))}
                {stops.length === 0 && <tr><td colSpan={5} className="p-4 text-center text-gray-500">No stops yet</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default RouteFaresPage;
