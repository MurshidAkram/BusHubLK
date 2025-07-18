import React, { useState } from 'react';
import { 
  FaSearch, FaBoxes, FaTools, FaPlusCircle, 
  FaFilter, FaWarehouse 
} from 'react-icons/fa';

interface SparePart {
  id: string;
  name: string;
  partNumber: string;
  category: string;
  currentStock: number;
  minStockLevel: number;
  location: string;
  compatibleBuses: string[];
  lastRestocked: string;
  unit: string;
}

interface Bus {
  id: string;
  number: string;
  model: string;
  currentDepot: string;
}

const SparePartsInventory: React.FC = () => {
  // Sample data
  const initialParts: SparePart[] = [
    {
      id: 'SP-1001',
      name: 'Brake Pad Set',
      partNumber: 'BP-2023-F',
      category: 'Braking System',
      currentStock: 24,
      minStockLevel: 10,
      location: 'Shelf A3',
      compatibleBuses: ['All models'],
      lastRestocked: '2023-05-15',
      unit: 'set'
    },
    {
      id: 'SP-1002',
      name: 'Engine Oil 5W-30',
      partNumber: 'OIL-5W30-S',
      category: 'Lubricants',
      currentStock: 56,
      minStockLevel: 20,
      location: 'Storage B1',
      compatibleBuses: ['Model X', 'Model Y'],
      lastRestocked: '2023-06-01',
      unit: 'liter'
    }
  ];

  const buses: Bus[] = [
    { id: 'BUS-001', number: 'NC-1234', model: 'Model X', currentDepot: 'Main Depot' },
    { id: 'BUS-002', number: 'NC-5678', model: 'Model Y', currentDepot: 'Main Depot' }
  ];

  // State management
  const [parts, setParts] = useState<SparePart[]>(initialParts);
  const [selectedPart, setSelectedPart] = useState<SparePart | null>(null);
  const [selectedBus, setSelectedBus] = useState<Bus | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [showUseModal, setShowUseModal] = useState<boolean>(false);
  const [showRestockModal, setShowRestockModal] = useState<boolean>(false);
  const [restockQuantity, setRestockQuantity] = useState<number>(0);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [lowStockOnly, setLowStockOnly] = useState<boolean>(false);

  // Get unique categories for filter
  const categories = ['All', ...Array.from(new Set(initialParts.map(part => part.category)))];

  // Filter parts based on search and filters
  const filteredParts = parts.filter(part => {
    const matchesSearch = 
      part.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      part.partNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = filterCategory === 'All' || part.category === filterCategory;
    const matchesLowStock = !lowStockOnly || part.currentStock <= part.minStockLevel;
    
    return matchesSearch && matchesCategory && matchesLowStock;
  });

  // Handle using a part
  const handleUsePart = () => {
    if (!selectedPart || !selectedBus || quantity <= 0) return;
    
    const updatedParts = parts.map(part => 
      part.id === selectedPart.id 
        ? { ...part, currentStock: part.currentStock - quantity } 
        : part
    );
    
    setParts(updatedParts);
    setShowUseModal(false);
    setSelectedPart(null);
    setSelectedBus(null);
    setQuantity(1);
  };

  // Handle restocking a part
  const handleRestockPart = () => {
    if (!selectedPart || restockQuantity <= 0) return;
    
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
  };

  // Get stock status color
  const getStockStatus = (part: SparePart) => {
    if (part.currentStock === 0) return 'bg-red-100 text-red-800';
    if (part.currentStock <= part.minStockLevel) return 'bg-yellow-100 text-yellow-800';
    return 'bg-green-100 text-green-800';
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
            
            {/* Category Filter */}
            <div className="relative">
              <FaFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-blue-500 focus:border-blue-500 appearance-none"
              >
                {categories.map(category => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
            </div>
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
              {parts.filter(p => p.currentStock > 0 && p.currentStock <= p.minStockLevel).length}
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Part Number</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredParts.map((part) => (
                  <tr key={part.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{part.name}</div>
                      <div className="text-sm text-gray-500">{part.compatibleBuses.join(', ')}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {part.category}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {part.partNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStockStatus(part)}`}>
                        {part.currentStock} {part.unit} (min: {part.minStockLevel})
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex items-center">
                        <FaWarehouse className="mr-1 text-gray-400" />
                        {part.location}
                      </div>
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  <FaTools className="inline mr-2 text-blue-500" />
                  Use Part: {selectedPart.name}
                </h3>
                
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Bus
                  </label>
                  <select
                    value={selectedBus?.id || ''}
                    onChange={(e) => {
                      const bus = buses.find(b => b.id === e.target.value) || null;
                      setSelectedBus(bus);
                    }}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Select a bus</option>
                    {buses
                      .filter(bus => 
                        selectedPart.compatibleBuses.includes('All models') || 
                        selectedPart.compatibleBuses.includes(bus.model)
                      )
                      .map(bus => (
                        <option key={bus.id} value={bus.id}>
                          {bus.number} ({bus.model})
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
                      setSelectedBus(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUsePart}
                    disabled={!selectedBus || quantity <= 0 || quantity > selectedPart.currentStock}
                    className={`px-4 py-2 rounded-md text-sm font-medium text-white ${!selectedBus || quantity <= 0 || quantity > selectedPart.currentStock ? 'bg-blue-300 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
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
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
              <div className="p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  <FaPlusCircle className="inline mr-2 text-green-500" />
                  Restock Part: {selectedPart.name}
                </h3>
                
                <div className="mb-4">
                  <p className="text-sm text-gray-500 mb-2">
                    Current Stock: {selectedPart.currentStock} {selectedPart.unit}
                  </p>
                  <p className="text-sm text-gray-500">
                    Minimum Required: {selectedPart.minStockLevel} {selectedPart.unit}
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
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowRestockModal(false);
                      setSelectedPart(null);
                      setRestockQuantity(0);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleRestockPart}
                    disabled={restockQuantity <= 0}
                    className={`px-4 py-2 rounded-md text-sm font-medium text-white ${restockQuantity <= 0 ? 'bg-green-300 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                  >
                    Confirm Restock
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