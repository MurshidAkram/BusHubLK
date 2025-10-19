// scripts/fetchDepotCoords.js
const fetch = require('node-fetch');

const apiKey = process.env.GOOGLE_GEOCODE_API_KEY ?? 'AIzaSyDIFCIyfq8Is4todRGQzAlGGp67tSVC4T4';

// depot name → phone (phone isn’t used by the API, but kept for reference)
const depots = [
  ['Colombo head office', '011 7 70 63 20'],
  ['Angoda', '011 7 706 320'],
  ['Avissawella', '036 2 222 348'],
  ['Central Bus stand', '011 2 328 081'],
  ['Homagama', '011 7 706 330'],
  ['Kesbewa', '011 7 70 63 60'],
  ['Katubadda', '011 7 70 63 50'],
  ['Maharagama', '011 2 85 03 31'],
  ['Mattakkuliya', '011 7 70 6420'],
  ['Meethotamulla', '011 7 706 410'],
  ['Moratuwa', '011 7 706 395'],
  ['Rathmalana', '011 7 706 440'],
  ['Thalangama', '011 2 862 317'],
  ['Udahamulla', '011 7 706 480'],
];

async function geocode(name) {
  const url = new URL('https://maps.googleapis.com/maps/api/geocode/json');
  url.searchParams.set('address', `${name}, Sri Lanka`);
  url.searchParams.set('key', apiKey);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();

  if (data.status !== 'OK' || !data.results?.length) {
    throw new Error(`${data.status}: ${data.error_message ?? 'no results'}`);
  }

  const { lat, lng } = data.results[0].geometry.location;
  return { lat, lng, formattedAddress: data.results[0].formatted_address };
}

async function main() {
  for (const [name, phone] of depots) {
    try {
      const result = await geocode(name);
      console.log(`${name} (${phone})`);
      console.log(`  Address: ${result.formattedAddress}`);
      console.log(`  Lat: ${result.lat}, Lng: ${result.lng}\n`);
    } catch (err) {
      console.error(`Failed for ${name}: ${err.message}\n`);
    }
    await new Promise(r => setTimeout(r, 250)); // polite delay
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});