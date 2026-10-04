import React, {useEffect, useId, useRef, useState} from 'react';
import {MapPin} from 'lucide-react';
import {isValidLocation, locationLabel, normalizeCityResults} from './locations.js';
import './locations.css';

export function LocationLabel({location}) {
  return <span className="location-label"><MapPin size={13} aria-hidden="true"/>{locationLabel(location)}</span>;
}

export default function LocationPicker({location, onChange}) {
  const id = useId();
  const [query, setQuery] = useState(isValidLocation(location) ? locationLabel(location) : '');
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState('idle');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const requestVersion = useRef(0);
  useEffect(() => {
    if (!open || query.trim().length < 2 || isValidLocation(location)) return;
    const controller = new AbortController();
    const version = requestVersion.current;
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams({name: query.trim(), countryCode: 'US', count: '20', language: 'en', format: 'json'});
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?${params}`, {signal: controller.signal});
        if (!response.ok) throw new Error('City lookup failed');
        const data = await response.json();
        if (controller.signal.aborted || version !== requestVersion.current) return;
        setResults(normalizeCityResults(data.results));
        setStatus('done');
      } catch (error) {
        if (!controller.signal.aborted && version === requestVersion.current) setStatus('error');
      }
    }, 300);
    return () => {clearTimeout(timer); controller.abort();};
  }, [query, open, location]);

  const select = result => {
    requestVersion.current += 1;
    onChange({city: result.city, state: result.state, latitude: result.latitude, longitude: result.longitude});
    setQuery(locationLabel(result)); setOpen(false); setResults([]); setActive(-1); setStatus('idle');
  };
  return <div className="location-picker full-width">
    <label htmlFor={id}>City, State</label>
    <input id={id} role="combobox" autoComplete="off" placeholder="Search a US city, e.g. Warrensburg, MO"
      value={query} aria-expanded={open} aria-controls={`${id}-results`} aria-autocomplete="list"
      aria-activedescendant={open && active >= 0 ? `${id}-option-${active}` : undefined}
      aria-describedby={`${id}-help`} required
      onChange={event => {
        requestVersion.current += 1;
        const value = event.target.value;
        setQuery(value); onChange(null); setResults([]); setActive(-1); setOpen(true);
        setStatus(value.trim().length >= 2 ? 'loading' : 'idle');
      }}
      onFocus={() => {if (!isValidLocation(location) && query.trim().length >= 2) {setOpen(true); setStatus('loading');}}}
      onBlur={event => {if (!event.currentTarget.parentElement.contains(event.relatedTarget)) setOpen(false);}}
      onKeyDown={event => {
        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
          event.preventDefault(); setOpen(true);
          if (results.length) setActive(current => event.key === 'ArrowDown' ? (current + 1) % results.length : (current <= 0 ? results.length - 1 : current - 1));
        } else if (event.key === 'Enter' && open) {
          event.preventDefault(); if (results[active]) select(results[active]);
        } else if (event.key === 'Escape' && open) {
          event.preventDefault(); event.stopPropagation(); setOpen(false);
        }
      }}/>
    <ul id={`${id}-results`} role="listbox" aria-label="Matching US cities" hidden={!open || !results.length}>
      {results.map((result, index) => <li role="option" id={`${id}-option-${index}`} key={result.id} aria-selected={active === index}>
        <button type="button" tabIndex={-1} onMouseDown={event => event.preventDefault()} onClick={() => select(result)}>
          <LocationLabel location={result}/>{result.county && <small>{result.county}</small>}
        </button>
      </li>)}
    </ul>
    <p id={`${id}-help`} className="location-help" role="status">
      {isValidLocation(location) ? 'Connect finds players within 50 miles of this city.' :
        status === 'loading' && open ? 'Searching cities…' : status === 'error' && open ? 'Couldn’t search cities. Try again or check your connection.' :
        status === 'done' && open && !results.length ? 'No matching cities. Try a city name followed by its state.' : 'Select a city from the suggestions to save your location.'}
    </p>
    <small className="location-attribution">City lookup by <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> · <a href="https://www.geonames.org/" target="_blank" rel="noreferrer">GeoNames</a></small>
  </div>;
}
