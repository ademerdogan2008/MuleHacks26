import test from 'node:test';
import assert from 'node:assert/strict';
import {demoLocations, distanceMiles, isNearby, isValidLocation, locationLabel, normalizeCityResults, restoreProfile} from '../src/locations.js';

const origin = {city: 'Test City', state: 'MO', latitude: 0, longitude: 0};
const northAt = miles => ({...origin, latitude: miles / 3958.7613 * 180 / Math.PI});

test('50-mile radius includes the boundary and excludes distant or invalid locations', () => {
  assert.equal(distanceMiles(origin, origin), 0);
  assert.equal(isNearby(origin, northAt(49.99)), true);
  assert.equal(isNearby(origin, northAt(50)), true);
  assert.equal(isNearby(origin, northAt(50.01)), false);
  for (const invalid of [null, {}, {...origin, latitude: NaN}, {...origin, longitude: 181}, {...origin, latitude: '0'}, {...origin, state: 'XX'}, {...origin, city: ''}]) {
    assert.equal(isValidLocation(invalid), false);
    assert.equal(isNearby(origin, invalid), false);
    assert.equal(isNearby(invalid, origin), false);
  }
  assert.ok(Number.isFinite(distanceMiles(origin, {...origin, longitude: 180})));
});

test('nearby Missouri and distant fixtures use real city centers', () => {
  const [warrensburg, knobNoster, sedalia, clinton, holden, kansasCity, columbia, chicago] = demoLocations;
  for (const city of [knobNoster, sedalia, clinton, holden]) assert.equal(isNearby(warrensburg, city), true);
  for (const city of [kansasCity, columbia, chicago]) assert.equal(isNearby(warrensburg, city), false);
  assert.equal(locationLabel(warrensburg), 'Warrensburg, MO');
  assert.equal(locationLabel(null), 'Location not set');
});

test('old profiles retain saved fields while invalid locations become unset', () => {
  const defaults = {name: 'Jamie', games: ['Valorant'], location: null};
  const saved = {name: 'Saved name', bio: 'Saved bio', games: ['Minecraft']};
  assert.deepEqual(restoreProfile(saved, defaults), {...defaults, ...saved});
  assert.equal(restoreProfile({...saved, location: {city: 'Unverified'}}, defaults).location, null);
  assert.deepEqual(restoreProfile({...saved, location: demoLocations[0]}, defaults).location, demoLocations[0]);
  assert.deepEqual(restoreProfile(null, defaults), defaults);
});

test('lookup keeps US cities with valid coordinates and preserves ambiguous matches', () => {
  const result = {id: 1, name: 'Springfield', admin1: 'Missouri', admin2: 'Greene', country_code: 'US', feature_code: 'PPLA2', latitude: 37.2, longitude: -93.3};
  const normalized = normalizeCityResults([result, {...result, id: 2, admin1: 'Illinois'}, {...result, feature_code: 'DAM'}, {...result, country_code: 'CA'}, {...result, admin1: undefined}, {...result, latitude: 100}]);
  assert.equal(normalized.length, 2);
  assert.deepEqual(normalized.map(locationLabel), ['Springfield, MO', 'Springfield, IL']);
  assert.deepEqual(normalizeCityResults(), []);
});
