export const CONNECT_RADIUS_MILES = 50;
const EARTH_RADIUS_MILES = 3958.7613;
const states = Object.fromEntries(`Alabama:AL|Alaska:AK|Arizona:AZ|Arkansas:AR|California:CA|Colorado:CO|Connecticut:CT|Delaware:DE|District of Columbia:DC|Florida:FL|Georgia:GA|Hawaii:HI|Idaho:ID|Illinois:IL|Indiana:IN|Iowa:IA|Kansas:KS|Kentucky:KY|Louisiana:LA|Maine:ME|Maryland:MD|Massachusetts:MA|Michigan:MI|Minnesota:MN|Mississippi:MS|Missouri:MO|Montana:MT|Nebraska:NE|Nevada:NV|New Hampshire:NH|New Jersey:NJ|New Mexico:NM|New York:NY|North Carolina:NC|North Dakota:ND|Ohio:OH|Oklahoma:OK|Oregon:OR|Pennsylvania:PA|Rhode Island:RI|South Carolina:SC|South Dakota:SD|Tennessee:TN|Texas:TX|Utah:UT|Vermont:VT|Virginia:VA|Washington:WA|West Virginia:WV|Wisconsin:WI|Wyoming:WY`.split('|').map(state => state.split(':')));

export function isValidLocation(location) {
  return Boolean(location && typeof location.city === 'string' && location.city.trim() &&
    Object.values(states).includes(location.state) &&
    Number.isFinite(location.latitude) && Math.abs(location.latitude) <= 90 &&
    Number.isFinite(location.longitude) && Math.abs(location.longitude) <= 180);
}

export function locationLabel(location) {
  return isValidLocation(location) ? `${location.city}, ${location.state}` : 'Location not set';
}

export function distanceMiles(a, b) {
  if (!isValidLocation(a) || !isValidLocation(b)) return Infinity;
  const radians = degrees => degrees * Math.PI / 180;
  const latDiff = radians(b.latitude - a.latitude);
  const lonDiff = radians(b.longitude - a.longitude);
  const haversine = Math.sin(latDiff / 2) ** 2 + Math.cos(radians(a.latitude)) *
    Math.cos(radians(b.latitude)) * Math.sin(lonDiff / 2) ** 2;
  return 2 * EARTH_RADIUS_MILES * Math.asin(Math.sqrt(Math.min(1, Math.max(0, haversine))));
}

export function isNearby(a, b) {
  // Allow only floating-point rounding error at the inclusive boundary.
  return distanceMiles(a, b) <= CONNECT_RADIUS_MILES + 1e-9;
}

export function restoreProfile(saved, defaults) {
  const profile = saved && typeof saved === 'object' && !Array.isArray(saved) ? {...defaults, ...saved} : {...defaults};
  return {...profile, location: isValidLocation(profile.location) ? profile.location : null};
}

export function normalizeCityResults(results = []) {
  return results.filter(result => result.country_code === 'US' && result.feature_code?.startsWith('PPL'))
    .map(result => ({id: result.id, city: result.name, state: states[result.admin1],
      latitude: result.latitude, longitude: result.longitude, county: result.admin2 || ''}))
    .filter(isValidLocation);
}

export const demoLocations = [
  {city: 'Warrensburg', state: 'MO', latitude: 38.76279, longitude: -93.73605},
  {city: 'Knob Noster', state: 'MO', latitude: 38.76668, longitude: -93.55855},
  {city: 'Sedalia', state: 'MO', latitude: 38.70446, longitude: -93.22826},
  {city: 'Clinton', state: 'MO', latitude: 38.36863, longitude: -93.77827},
  {city: 'Holden', state: 'MO', latitude: 38.71418, longitude: -93.99133},
  {city: 'Kansas City', state: 'MO', latitude: 39.09973, longitude: -94.57857},
  {city: 'Columbia', state: 'MO', latitude: 38.95171, longitude: -92.33407},
  {city: 'Chicago', state: 'IL', latitude: 41.85003, longitude: -87.65005},
];
