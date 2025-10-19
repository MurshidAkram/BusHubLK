const haversine = (lat1, lon1, lat2, lon2) => {
  const R = 6371;
  const toRad = deg => (deg * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

const passenger = { lat: 6.8714, lon: 79.8634 };
const depots = {
  Rathmalana: { lat: 6.8208, lon: 79.886 },
  Moratuwa: { lat: 6.7723, lon: 79.8829 },
  Katubedda: { lat: 6.7909, lon: 79.8808 },
  Udahamulla: { lat: 6.853, lon: 79.9192 },
  Maharagama: { lat: 6.8645, lon: 79.9272 },
  Homagama: { lat: 6.8596, lon: 80.0123 },
  Kesbewa: { lat: 6.7865, lon: 79.9463 },
  Meetotamulla: { lat: 6.9189, lon: 79.8973 },
  Talangama: { lat: 6.9069, lon: 79.9576 },
  Mattakkuliya: { lat: 6.9749, lon: 79.886 },
  Angoda: { lat: 6.9248, lon: 79.9678 },
  Avissawella: { lat: 6.9537, lon: 80.2078 },
  Negombo: { lat: 7.2114, lon: 79.8451 },
  Divulapitiya: { lat: 7.2341, lon: 79.9404 },
  Nittambuwa: { lat: 7.1528, lon: 80.0569 },
  Kirindiwela: { lat: 7.0279, lon: 80.0638 },
  Gampaha: { lat: 7.0863, lon: 79.9984 },
  Kadawatha: { lat: 7.0094, lon: 79.9696 },
  Kelaniya: { lat: 6.9589, lon: 79.9238 },
  Welisara: { lat: 6.9945, lon: 79.8998 },
  "Ja-Ela": { lat: 7.0886, lon: 79.8931 },
};

const results = Object.entries(depots)
  .map(([name, coords]) => ({ name, distance: haversine(passenger.lat, passenger.lon, coords.lat, coords.lon) }))
  .sort((a, b) => a.distance - b.distance);

for (const { name, distance } of results) {
  console.log(name, distance.toFixed(3));
}
