/*
Patch to add location update API function to driverAPI in driver-app/src/services/api.ts

Add the following function inside the driverAPI object:

  // New: Send location update to backend
  sendLocationUpdate: async (locationData: {
    latitude: number;
    longitude: number;
    busId: string;
    routeId: string;
    timestamp: string;
  }) => {
    const token = await storageAPI.getAuthToken();
    const response = await fetch(`${API_BASE_URL}/driver/location-update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(locationData),
    });
    return response.json();
  },

This patch file is for reference only. Please manually add this function inside the driverAPI export in api.ts.
*/
