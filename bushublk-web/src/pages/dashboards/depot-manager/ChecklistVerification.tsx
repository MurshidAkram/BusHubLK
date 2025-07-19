import React, { useState } from "react";
import { Pencil, Trash2, CheckCircle } from "lucide-react";

const partsList = ["Brakes", "Tires", "Lights", "Horn", "Mirrors"];
const mockRoutes = [
  { routeId: 1, routeName: "100 - Colombo – Panadura", buses: ["NB-1001", "NB-1002"] },
  { routeId: 2, routeName: "101 - Colombo – Moratuwa", buses: ["NB-1011", "NB-1012"] },
  { routeId: 3, routeName: "122 - Colombo – Avissawella", buses: ["NB-1221", "NB-1222"] },
  { routeId: 4, routeName: "154 - Colombo – Kiribathgoda", buses: ["NB-1541", "NB-1542"] },
  { routeId: 5, routeName: "120 - Colombo – Horana", buses: ["NB-1201", "NB-1202"] },
  { routeId: 6, routeName: "15 - Pettah – Galle", buses: ["NB-1501", "NB-1502"] }
];
const drivers = ["Malin Ekanayake", "Sanjeewa Perera", "Victor Ranawira", "Kumar Silva", "Nandana Jayasinghe"];
const conductors = ["Sudath Fernando", "Tissa Gunasekara", "Jagath Rathnayake", "Ruwan Jayawardhana", "Indika Madurawira"];

type ChecklistItem = {
  busId: string;
  routeName: string;
  busNumber: string;
  driver: string;
  conductor: string;
  fuel: string;
  kilometers: string;
  status: "Pending" | "Released";
  partsChecked: Record<string, boolean>;
};

const ChecklistVerification: React.FC = () => {
  const [selectedRouteId, setSelectedRouteId] = useState<string>("");
  const [selectedBus, setSelectedBus] = useState("");
  const [tripType, setTripType] = useState<"Pre" | "Post">("Pre");

  const [checklistData, setChecklistData] = useState<ChecklistItem[]>([]);

  const currentRoute = mockRoutes.find(r => r.routeId.toString() === selectedRouteId);

  const handleInputChange = (
    busId: string,
    field: keyof Omit<ChecklistItem, "partsChecked" | "busId" | "routeName" | "busNumber" | "status">,
    value: string
  ) => {
    setChecklistData(prev =>
      prev.map(item =>
        item.busId === busId ? { ...item, [field]: value } : item
      )
    );
  };

  const handleCheckboxToggle = (busId: string, part: string) => {
    setChecklistData(prev =>
      prev.map(item =>
        item.busId === busId
          ? {
              ...item,
              partsChecked: {
                ...item.partsChecked,
                [part]: !item.partsChecked[part]
              }
            }
          : item
      )
    );
  };

  const handleAddBus = () => {
    if (!currentRoute || !selectedBus) return;

    const busId = `${currentRoute.routeName}-${selectedBus}`;
    if (checklistData.some(item => item.busId === busId)) return;

    setChecklistData(prev => [
      ...prev,
      {
        busId,
        routeName: currentRoute.routeName,
        busNumber: selectedBus,
        driver: "",
        conductor: "",
        fuel: "",
        kilometers: "",
        status: "Pending",
        partsChecked: partsList.reduce((acc, part) => {
          acc[part] = false;
          return acc;
        }, {} as Record<string, boolean>)
      }
    ]);

    setSelectedBus("");
  };

  const handleSave = (busId: string) => {
    alert(`Checklist saved for ${busId} (${tripType}-trip)`);
  };

  const handleDelete = (busId: string) => {
    setChecklistData(prev => prev.filter(item => item.busId !== busId));
  };

  const handleStatusToggle = (busId: string) => {
    setChecklistData(prev =>
      prev.map(item =>
        item.busId === busId
          ? { ...item, status: item.status === "Pending" ? "Released" : "Pending" }
          : item
      )
    );
  };

  return (
    <div className="p-4 max-w-full overflow-x-auto">
      {/* Tab Buttons */}
      <div className="flex gap-4 mb-6">
        <button
          className={`px-4 py-2 rounded-full font-medium ${
            tripType === "Pre" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
          }`}
          onClick={() => setTripType("Pre")}
        >
          Pre-trip
        </button>
        <button
          className={`px-4 py-2 rounded-full font-medium ${
            tripType === "Post" ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600"
          }`}
          onClick={() => setTripType("Post")}
        >
          Post-trip
        </button>
      </div>

      {/* Add Checklist Form */}
      <div className="border border-blue-200 rounded-xl shadow p-6 mb-8 min-w-[1000px] bg-white">
        <h1 className="text-2xl font-extrabold text-gray-900 mb-2">Checklist Verification</h1>
        <p className="text-gray-700 mb-6">Verify buses before dispatch and after return.</p>
        <div className="flex flex-wrap gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Route</label>
            <select
              value={selectedRouteId}
              onChange={(e) => setSelectedRouteId(e.target.value)}
              className="border rounded px-3 py-2 w-64"
            >
              <option value="">Select Route</option>
              {mockRoutes.map((route) => (
                <option key={route.routeId} value={route.routeId.toString()}>
                  {route.routeName}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bus</label>
            <select
              disabled={!selectedRouteId}
              value={selectedBus}
              onChange={(e) => setSelectedBus(e.target.value)}
              className="border rounded px-3 py-2 w-64 disabled:bg-gray-100"
            >
              <option value="">Select Bus</option>
              {currentRoute?.buses.map((bus) => (
                <option key={bus} value={bus}>{bus}</option>
              ))}
            </select>
          </div>
          <button
            onClick={handleAddBus}
            className="px-4 py-2 mt-auto bg-blue-600 hover:bg-blue-700 text-white rounded shadow"
          >
            + Add Checklist
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="min-w-[1200px] overflow-x-auto bg-white rounded-xl shadow">
        <table className="table-auto w-full text-sm text-left">
          <thead className="bg-blue-50">
            <tr>
              {["Route", "Bus No", "Driver", "Conductor", "Fuel (L)", "KM", "Parts", "Status", "Actions"].map((header) => (
                <th key={header} className="w-[150px] px-4 py-2 font-semibold text-gray-700 border-b">{header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {checklistData.map((bus) => (
              <tr key={bus.busId} className="hover:bg-blue-50">
                <td className="px-4 py-2">{bus.routeName}</td>
                <td className="px-4 py-2">{bus.busNumber}</td>
                <td className="px-4 py-2">
                  {bus.status === "Released" ? bus.driver : (
                    <select
                      value={bus.driver}
                      onChange={(e) => handleInputChange(bus.busId, "driver", e.target.value)}
                      className="w-full border rounded px-2 py-1"
                    >
                      <option value="">Select</option>
                      {drivers.map(name => <option key={name}>{name}</option>)}
                    </select>
                  )}
                </td>
                <td className="px-4 py-2">
                  {bus.status === "Released" ? bus.conductor : (
                    <select
                      value={bus.conductor}
                      onChange={(e) => handleInputChange(bus.busId, "conductor", e.target.value)}
                      className="w-full border rounded px-2 py-1"
                    >
                      <option value="">Select</option>
                      {conductors.map(name => <option key={name}>{name}</option>)}
                    </select>
                  )}
                </td>
                <td className="px-4 py-2 text-center">
                  {bus.status === "Released" ? bus.fuel : (
                    <input
                      type="number"
                      value={bus.fuel}
                      onChange={(e) => handleInputChange(bus.busId, "fuel", e.target.value)}
                      className="w-20 border rounded text-center"
                    />
                  )}
                </td>
                <td className="px-4 py-2 text-center">
                  {bus.status === "Released" ? bus.kilometers : (
                    <input
                      type="number"
                      value={bus.kilometers}
                      onChange={(e) => handleInputChange(bus.busId, "kilometers", e.target.value)}
                      className="w-24 border rounded text-center"
                    />
                  )}
                </td>
                <td className="px-4 py-2">
                  <div className="flex flex-col space-y-1">
                    {partsList.map((part) => (
                      <label key={part} className="inline-flex items-center space-x-2 text-xs">
                        <input
                          type="checkbox"
                          checked={bus.partsChecked[part]}
                          disabled={bus.status === "Released"}
                          onChange={() => handleCheckboxToggle(bus.busId, part)}
                          className="form-checkbox h-4 w-4"
                        />
                        <span>{part}</span>
                      </label>
                    ))}
                  </div>
                </td>
                <td className="px-4 py-2 text-center">
                  <span className={`inline-block px-2 py-1 rounded-full text-xs font-semibold ${
                    bus.status === "Pending" ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"
                  }`}>{bus.status}</span>
                </td>
                <td className="px-4 py-2 text-center">
                  <div className="flex justify-center gap-2">
                    <button onClick={() => handleSave(bus.busId)} className="text-green-600 hover:text-green-800">
                      <Pencil size={16} />
                    </button>
                    <button onClick={() => handleStatusToggle(bus.busId)} className="text-blue-600 hover:text-blue-800">
                      <CheckCircle size={16} />
                    </button>
                    <button onClick={() => handleDelete(bus.busId)} className="text-red-600 hover:text-red-800">
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {checklistData.length === 0 && (
              <tr>
                <td colSpan={9} className="text-center py-6 text-gray-400">No checklists yet. Add a bus above.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ChecklistVerification;
