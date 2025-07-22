import React, { useState } from 'react';
import { FaSearch, FaBoxes, FaTools, FaPlusCircle } from 'react-icons/fa';

interface SparePart {
  id: string;
  Partname: string;
  PartId: string;
  currentStock: number;
  lastRestocked: string;
  unit: string;
  busId?: string;
}

const SparePartsInventory: React.FC = () => {
  // Sample data
  const initialParts: SparePart[] = [
    {
      id: 'SP-1001',
      Partname: 'Brake Pad Set',
      PartId: 'P-2025-001',
      currentStock: 24,
      lastRestocked: '2025-07-18',
      unit: 'set',
      busId: 'NP-2345'
    },
    {
      id: 'SP-1002',
      Partname: 'Engine Oil 5W-30',
      PartId: 'P-2025-002',
      currentStock: 56,
      lastRestocked: '2025-07-17',
      unit: 'liter',
      busId: 'NA-1234'
    }
  ];

  // Sample bus data with updated format
  const buses = [
    { id: '17', Reg_number: 'NC-1234' },
    { id: '23', Reg_number: 'NP-3456' },
    { id: '21', Reg_number: 'LA-9831' }
  ];

  // State management
  const [parts, setParts] = useState<SparePart[]>(initialParts);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [selectedBusId, setSelectedBusId] = useState<string>('');
  const [showUseModal, setShowUseModal] = useState<boolean>(false);
  const [showRestockModal, setShowRestockModal] = useState<boolean>(false);
  const [restockQuantity, setRestockQuantity] = useState<number>(0);
  const [restockUnit, setRestockUnit] = useState<string>('');
  const [showAddPartModal, setShowAddPartModal] = useState<boolean>(false);
  const [newPart, setNewPart] = useState<Omit<SparePart, 'id' | 'lastRestocked'>>({
    Partname: '',
    PartId: '',
    currentStock: 0,
    unit: ''
  });

  // Filter parts based on search and low stock filter
  const filteredParts = parts.filter(part => {
    const matchesSearch = 
      part.Partname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.PartId.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  // Get stock status color
  const getStockStatus = (part: SparePart) => {
    if (part.currentStock === 0) return 'bg-red-100 text-red-800';
    return 'bg-green-100 text-green-800';
  };

  // Handle using a part
  const handleUsePart = () => {
    if (!selectedPart || quantity <= 0 || !selectedBusId) return;
    
    const updatedParts = parts.map(part => 
      part.id === selectedPart.id 
        ? { ...part, currentStock: part.currentStock - quantity } 
        : part
    );
    
    setParts(updatedParts);
    setShowUseModal(false);
    setSelectedPart(null);
    setQuantity(1);
    setSelectedBusId('');
  };

  // Handle restocking a part
  const handleRestockPart = () => {
    if (!selectedPart || restockQuantity <= 0 || restockUnit !== selectedPart.unit) return;
    
    const updatedParts = parts.map(part => 
      part.id === selectedPart.id 
        ? { 
            ...part, 
            currentStock: part.currentStock + restockQuantity,
            lastRestocked: new Date().toISOString().split('T')[0]
          } 
        : part
    );
    
    setParts(updatedParts);
    setShowRestockModal(false);
    setSelectedPart(null);
    setRestockQuantity(0);
    setRestockUnit('');
  };

  // Handle adding a new part
  const handleAddPart = () => {
    if (!newPart.Partname.trim() || !newPart.unit.trim() || !newPart.PartId.trim()) return;
    
    const newPartData: SparePart = {
      id: `SP-${Date.now()}`,
      lastRestocked: new Date().toISOString().split('T')[0],
      ...newPart
    };
    
    setParts([...parts, newPartData]);
    setShowAddPartModal(false);
    setNewPart({
      Partname: '',
      PartId: '',
      currentStock: 0,
      unit: ''
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div className="flex items-center mb-4 md:mb-0">
            <FaBoxes className="text-2xl text-blue-600 mr-3" />
            <h1 className="text-2xl font-bold text-gray-800">Spare Parts Inventory</h1>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search */}
            <div className="relative flex-grow">
              <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search parts..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            {/* Add New Part Button */}
            <button
              onClick={() => setShowAddPartModal(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              <FaPlusCircle className="w-4 h-4" />
              Add New
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4 mb-6">
          <label className="inline-flex items-center">
            <input
              type="checkbox"
              checked={lowStockOnly}
              onChange={(e) => setLowStockOnly(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="ml-2 text-gray-700">Show low stock only</span>
          </label>
        </div>

        {/* Inventory Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-blue-500">
            <h3 className="text-gray-500 text-sm font-medium">Total Parts</h3>
            <p className="text-2xl font-bold">{parts.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-green-500">
            <h3 className="text-gray-500 text-sm font-medium">In Stock</h3>
            <p className="text-2xl font-bold">
              {parts.filter(p => p.currentStock > 0).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-yellow-500">
            <h3 className="text-gray-500 text-sm font-medium">Low Stock</h3>
            <p className="text-2xl font-bold">
              {parts.filter(p => p.currentStock > 0 && p.currentStock < 10).length}
            </p>
          </div>
          <div className="bg-white p-4 rounded-lg shadow border-l-4 border-red-500">
            <h3 className="text-gray-500 text-sm font-medium">Out of Stock</h3>
            <p className="text-2xl font-bold">
              {parts.filter(p => p.currentStock === 0).length}
            </p>
          </div>
        </div>

        {/* Parts Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Available Stock</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredParts.map((part) => (
                  <tr key={part.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {part.PartId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{part.Partname}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockStatus(part)}`}>
                        {part.currentStock} {part.unit}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedPart(part);
                          setShowUseModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 mr-3"
                        disabled={part.currentStock === 0}
                      >
                        <FaTools className="inline mr-1" /> Use
                      </button>
                      <button
                        onClick={() => {
                          setSelectedPart(part);
                          setRestockUnit(part.unit);
                          setShowRestockModal(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                      >
                        <FaPlusCircle className="inline mr-1" /> Restock
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Use Part Modal */}
        {showUseModal && selectedPart && (
           <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  <FaTools className="inline mr-2 text-blue-500" />
                  Use Part: {selectedPart.Partname}
                </h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Bus
                  </label>
                  <select
                    value={selectedBusId}
                    onChange={(e) => setSelectedBusId(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a bus</option>
                    {buses.map(bus => (
                      <option key={bus.id} value={bus.id}>
                        {bus.Reg_number}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity to Use (Available: {selectedPart.currentStock} {selectedPart.unit})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedPart.currentStock}
                    value={quantity}
                    onChange={(e) => setQuantity(Math.min(Number(e.target.value), selectedPart.currentStock))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowUseModal(false);
                      setSelectedPart(null);
                      setSelectedBusId('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUsePart}
                    disabled={quantity <= 0 || quantity > selectedPart.currentStock || !selectedBusId}
                    className={`px-4 py-2 rounded-md text-sm font-medium text-white ${quantity <= 0 || quantity > selectedPart.currentStock || !selectedBusId ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                  >
                    Confirm Usage
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Restock Part Modal */}
        {showRestockModal && selectedPart && (
          <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  <FaPlusCircle className="inline mr-2 text-green-500" />
                  Restock Part: {selectedPart.Partname}
                </h3>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">
                    Current Stock: {selectedPart.currentStock} {selectedPart.unit}
                  </p>
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Quantity to Add
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={restockQuantity}
                    onChange={(e) => setRestockQuantity(Number(e.target.value))}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit (Must match: {selectedPart.unit})
                  </label>
                  <input
                    type="text"
                    value={restockUnit}
                    onChange={(e) => setRestockUnit(e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowRestockModal(false);
                      setSelectedPart(null);
                      setRestockQuantity(0);
                      setRestockUnit('');
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRestockPart}
                    disabled={restockQuantity <= 0 || restockUnit !== selectedPart.unit}
                    className={`px-4 py-2 rounded-md text-sm font-medium text-white ${restockQuantity <= 0 || restockUnit !== selectedPart.unit ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    Confirm Restock
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add New Part Modal */}
        {showAddPartModal && (
           <div className="fixed inset-0 backdrop-blur-sm bg-white/10 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  <FaPlusCircle className="inline mr-2 text-purple-500" />
                  Add New Part
                </h3>
                
                <div className="space-y-4">
                  {/* <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Part ID</label>
                    <input
                      type="text"
                      value={newPart.PartId}
                      onChange={(e) => setNewPart({ ...newPart, PartId: e.target.value })}
                      placeholder="Enter part ID"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div> */}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Part Name</label>
                    <input
                      type="text"
                      value={newPart.Partname}
                      onChange={(e) => setNewPart({ ...newPart, Partname: e.target.value })}
                      placeholder="Enter part name"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Initial Stock</label>
                    <input
                      type="number"
                      min="0"
                      value={newPart.currentStock}
                      onChange={(e) => setNewPart({ ...newPart, currentStock: Number(e.target.value) })}
                      placeholder="Enter initial stock"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                    <input
                      type="text"
                      value={newPart.unit}
                      onChange={(e) => setNewPart({ ...newPart, unit: e.target.value })}
                      placeholder="Enter unit (e.g., set, liter)"
                      className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowAddPartModal(false);
                      setNewPart({
                        Partname: '',
                        PartId: '',
                        currentStock: 0,
                        unit: ''
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddPart}
                    disabled={!newPart.Partname.trim() || !newPart.unit.trim() }
                    className={`px-4 py-2 rounded-md text-sm font-medium text-white ${!newPart.Partname.trim() || !newPart.unit.trim() ? 'bg-purple-300 cursor-not-allowed' : 'bg-purple-600 hover:bg-purple-700'}`}
                  >
                    Add Part
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SparePartsInventory;