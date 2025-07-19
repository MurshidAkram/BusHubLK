import React, { useState } from 'react';

interface ResourceAllocation {
  id: number;
  depot: string;
  resourceName: string;
  allocatedTo: string;
  allocationDate: string; // yyyy-mm-dd
  status: 'Active' | 'Pending' | 'Inactive';
}

const depots = ['Colombo Depot', 'Pettah', 'Nugegoda', 'Kotte', 'Dehiwala', 'Bambalapitiya', 'Moratuwa'];

const AssetDistribution = () => {
  const [allocations, setAllocations] = useState<ResourceAllocation[]>([
    { id: 1, depot: 'Colombo Depot', resourceName: 'Bus #123', allocatedTo: 'Route 5', allocationDate: '2025-07-18', status: 'Active' },
    { id: 2, depot: 'Pettah', resourceName: 'Driver John', allocatedTo: 'Bus #456', allocationDate: '2025-07-15', status: 'Pending' },
    { id: 3, depot: 'Nugegoda', resourceName: 'Bus #789', allocatedTo: 'Route 12', allocationDate: '2025-07-10', status: 'Active' },
    { id: 4, depot: 'Kotte', resourceName: 'Conductor Mary', allocatedTo: 'Bus #321', allocationDate: '2025-07-12', status: 'Inactive' },
    { id: 5, depot: 'Dehiwala', resourceName: 'Bus #654', allocatedTo: 'Route 7', allocationDate: '2025-07-16', status: 'Active' },
    { id: 6, depot: 'Bambalapitiya', resourceName: 'Driver Sam', allocatedTo: 'Bus #987', allocationDate: '2025-07-14', status: 'Pending' },
    { id: 7, depot: 'Moratuwa', resourceName: 'Bus #852', allocatedTo: 'Route 3', allocationDate: '2025-07-11', status: 'Active' },
    { id: 8, depot: 'Colombo Depot', resourceName: 'Conductor Lisa', allocatedTo: 'Bus #963', allocationDate: '2025-07-13', status: 'Active' },
    { id: 9, depot: 'Pettah', resourceName: 'Bus #741', allocatedTo: 'Route 9', allocationDate: '2025-07-09', status: 'Inactive' },
    { id: 10, depot: 'Nugegoda', resourceName: 'Driver Mike', allocatedTo: 'Bus #258', allocationDate: '2025-07-08', status: 'Pending' },
    { id: 11, depot: 'Kotte', resourceName: 'Bus #147', allocatedTo: 'Route 4', allocationDate: '2025-07-17', status: 'Active' },
    { id: 12, depot: 'Dehiwala', resourceName: 'Conductor Anna', allocatedTo: 'Bus #369', allocationDate: '2025-07-14', status: 'Active' },
    { id: 13, depot: 'Bambalapitiya', resourceName: 'Bus #753', allocatedTo: 'Route 8', allocationDate: '2025-07-15', status: 'Pending' },
    { id: 14, depot: 'Moratuwa', resourceName: 'Driver Kevin', allocatedTo: 'Bus #456', allocationDate: '2025-07-10', status: 'Active' },
    { id: 15, depot: 'Colombo Depot', resourceName: 'Bus #159', allocatedTo: 'Route 6', allocationDate: '2025-07-13', status: 'Active' },
  ]);

  const [filterDepot, setFilterDepot] = useState<string>('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [editAllocation, setEditAllocation] = useState<ResourceAllocation | null>(null);

  const [formDepot, setFormDepot] = useState('');
  const [formResourceName, setFormResourceName] = useState('');
  const [formAllocatedTo, setFormAllocatedTo] = useState('');
  const [formAllocationDate, setFormAllocationDate] = useState('');
  const [formStatus, setFormStatus] = useState<'Active' | 'Pending' | 'Inactive'>('Active');

  const openNewModal = () => {
    setEditAllocation(null);
    setFormDepot('');
    setFormResourceName('');
    setFormAllocatedTo('');
    setFormAllocationDate('');
    setFormStatus('Active');
    setModalOpen(true);
  };

  const openEditModal = (allocation: ResourceAllocation) => {
    setEditAllocation(allocation);
    setFormDepot(allocation.depot);
    setFormResourceName(allocation.resourceName);
    setFormAllocatedTo(allocation.allocatedTo);
    setFormAllocationDate(allocation.allocationDate);
    setFormStatus(allocation.status);
    setModalOpen(true);
  };

  const saveAllocation = () => {
    if (!formDepot || !formResourceName || !formAllocatedTo || !formAllocationDate) {
      alert('Please fill all fields');
      return;
    }

    if (editAllocation) {
      setAllocations((prev) =>
        prev.map((alloc) =>
          alloc.id === editAllocation.id
            ? {
                ...alloc,
                depot: formDepot,
                resourceName: formResourceName,
                allocatedTo: formAllocatedTo,
                allocationDate: formAllocationDate,
                status: formStatus,
              }
            : alloc
        )
      );
    } else {
      const newAlloc: ResourceAllocation = {
        id: allocations.length ? allocations[allocations.length - 1].id + 1 : 1,
        depot: formDepot,
        resourceName: formResourceName,
        allocatedTo: formAllocatedTo,
        allocationDate: formAllocationDate,
        status: formStatus,
      };
      setAllocations((prev) => [...prev, newAlloc]);
    }
    setModalOpen(false);
  };

  const deleteAllocation = (id: number) => {
    if (window.confirm('Are you sure you want to delete this allocation?')) {
      setAllocations((prev) => prev.filter((alloc) => alloc.id !== id));
    }
  };

  const filteredAllocations =
    filterDepot === 'All' ? allocations : allocations.filter((alloc) => alloc.depot === filterDepot);

  return (
    <div >
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Depot-wise Resource Allocation</h1>

        <div className="flex items-center mb-4 space-x-4">
          <label htmlFor="depotFilter" className="font-medium">
            Filter by Depot:
          </label>
          <select
            id="depotFilter"
            className="border rounded p-1"
            value={filterDepot}
            onChange={(e) => setFilterDepot(e.target.value)}
          >
            <option value="All">All</option>
            {depots.map((depot) => (
              <option key={depot} value={depot}>
                {depot}
              </option>
            ))}
          </select>

          <button
            onClick={openNewModal}
            className="ml-auto bg-blue-600 text-white px-4 py-1 rounded hover:bg-blue-700"
          >
            + Allocate Resource
          </button>
        </div>

        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">Depot</th>
              <th className="border border-gray-300 p-2 text-left">Resource Name</th>
              <th className="border border-gray-300 p-2 text-left">Allocated To</th>
              <th className="border border-gray-300 p-2 text-left">Allocation Date</th>
              {/* Status column removed */}
              <th className="border border-gray-300 p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredAllocations.length === 0 && (
              <tr>
                <td colSpan={5} className="text-center p-4 text-gray-500">
                  No allocations found.
                </td>
              </tr>
            )}
            {filteredAllocations.map((alloc) => (
              <tr key={alloc.id} className="hover:bg-gray-50">
                <td className="border border-gray-300 p-2">{alloc.depot}</td>
                <td className="border border-gray-300 p-2">{alloc.resourceName}</td>
                <td className="border border-gray-300 p-2">{alloc.allocatedTo}</td>
                <td className="border border-gray-300 p-2">{alloc.allocationDate}</td>
                {/* Status column removed */}
                <td className="border border-gray-300 p-2 space-x-2">
                  <button
                    onClick={() => openEditModal(alloc)}
                    className="text-blue-600 hover:underline"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => deleteAllocation(alloc.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modalOpen && (
        <div
          className="fixed inset-0 flex justify-center items-center z-50"
          style={{
            backgroundColor: 'rgba(255 255 255 / 0.15)', // translucent white
            backdropFilter: 'blur(10px)', // glass blur effect
            WebkitBackdropFilter: 'blur(10px)',
          }}
        >
          <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
            <h2 className="text-xl font-semibold mb-4">
              {editAllocation ? 'Edit Allocation' : 'New Resource Allocation'}
            </h2>

            <div className="space-y-3">
              <div>
                <label className="block font-medium mb-1">Depot</label>
                <select
                  className="w-full border rounded p-2"
                  value={formDepot}
                  onChange={(e) => setFormDepot(e.target.value)}
                >
                  <option value="">Select Depot</option>
                  {depots.map((depot) => (
                    <option key={depot} value={depot}>
                      {depot}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-medium mb-1">Resource Name</label>
                <input
                  type="text"
                  className="w-full border rounded p-2"
                  value={formResourceName}
                  onChange={(e) => setFormResourceName(e.target.value)}
                  placeholder="E.g., Bus #123, Driver John"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Allocated To</label>
                <input
                  type="text"
                  className="w-full border rounded p-2"
                  value={formAllocatedTo}
                  onChange={(e) => setFormAllocatedTo(e.target.value)}
                  placeholder="E.g., Route 5, Bus #456"
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Allocation Date</label>
                <input
                  type="date"
                  className="w-full border rounded p-2"
                  value={formAllocationDate}
                  onChange={(e) => setFormAllocationDate(e.target.value)}
                />
              </div>

              <div>
                <label className="block font-medium mb-1">Status</label>
                <select
                  className="w-full border rounded p-2"
                  value={formStatus}
                  onChange={(e) => setFormStatus(e.target.value as any)}
                >
                  <option value="Active">Active</option>
                  <option value="Pending">Pending</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 mt-4">
                <button
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded border border-gray-300 hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  onClick={saveAllocation}
                  className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetDistribution;
