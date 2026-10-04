import React, {useEffect, useRef, useState} from 'react';
import {MapPin, LocateFixed, ArrowUpRight, CalendarDays, Clock3, Users, Check, Search, Radio, ArrowRight, X, Music, Coffee, Megaphone, Flag, Sparkles} from 'lucide-react';
import './events.css';
import {eventStatus, KANSAS_CITY_CENTER, KANSAS_CITY_BOUNDS} from './eventData.js';

const center = KANSAS_CITY_CENTER;
function EventPhoto({event}) {
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[event.image]);
 return <div className="event-photo">{event.image&&!failed?<img src={event.image} alt={`${event.title} event artwork`} loading="lazy" onError={()=>setFailed(true)}/>:<div className={`event-photo-fallback ${event.accent}`}><EventIcon type={event.type} size={40}/><span>Event photo unavailable</span></div>}</div>;
}
function EventIcon({type,size=22}) {
 const Icon={Concert:Music,Meetup:Coffee,Rally:Megaphone,Parade:Flag,Festival:Sparkles}[type]||CalendarDays;
 return <Icon size={size}/>;
}
let mapsPromise;
function loadMaps(key) {
 if(window.google?.maps?.importLibrary)return Promise.resolve(window.google.maps);
 if(mapsPromise)return mapsPromise;
 mapsPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  const fail=()=>{clearTimeout(timer);reject(new Error('Google Maps couldn’t load. You can still explore the event list.'));};
  const timer=setTimeout(fail,15000);
  window.sidequestMapsReady=()=>{clearTimeout(timer);resolve(window.google.maps);};
  window.gm_authFailure=()=>{fail();window.dispatchEvent(new Event('sidequest-map-auth-error'));};
  script.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&callback=sidequestMapsReady&v=weekly&libraries=marker`;
  script.async=true;script.onerror=fail;document.head.appendChild(script);
 }).catch(error=>{mapsPromise=undefined;throw error;});
 return mapsPromise;
}
function PreviewMap({center,events,selected,onSelect}) {
 return <div className="event-preview" aria-label="Illustrative layout of Kansas City events">
  <svg viewBox="0 0 800 580" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><pattern id="blocks" width="110" height="90" patternTransform="rotate(-18)" patternUnits="userSpaceOnUse"><rect width="110" height="90" fill="#1e2230"/><rect x="10" y="10" width="87" height="66" rx="8" fill="#252a39" stroke="#2b3142"/><path d="M0 0H110M0 0V90" stroke="#3a4051" strokeWidth="7"/></pattern></defs><rect width="800" height="580" fill="url(#blocks)"/><path d="M680 -40Q480 130 620 290T620 650L900 650V-40Z" fill="#182f43"/><path d="M-50 400Q180 460 310 240T740 -30" fill="none" stroke="#525065" strokeWidth="16"/><path d="M-50 400Q180 460 310 240T740 -30" fill="none" stroke="#777085" strokeWidth="2" strokeDasharray="8 8"/><path d="M100 80L180 60L210 155L130 177Z M380 430L465 406L500 500L415 526Z" fill="#263b36"/></svg>
  <span className="preview-neighborhood">YOUR NEXT SIDEQUEST</span><span className="preview-water">KANSAS CITY</span>
  <div className="you-pin"><span/><small>Kansas City center</small></div>
  {events.map(event=><button key={event.id} className={`event-pin ${event.accent} ${selected===event.id?'selected':''}`} style={{left:`${Math.max(8,Math.min(92,50+(event.position.lng-center.lng)*1600))}%`,top:`${Math.max(8,Math.min(92,50-(event.position.lat-center.lat)*1600))}%`}} aria-label={`Show ${event.title}`} onClick={()=>onSelect(event.id)}><EventIcon type={event.type} size={19}/>{event.live&&<i/>}</button>)}
  <span className="preview-label">Illustrative map · not to scale</span>
 </div>;
}
function LiveMap({center,events,selected,onSelect,onError}) {
 const node=useRef(null),map=useRef(null),pins=useRef([]),[ready,setReady]=useState(false);
 useEffect(()=>{
  let cancelled=false;
  const authFailure=()=>onError('Google Maps couldn’t authenticate. Check the API key configuration.');
  window.addEventListener('sidequest-map-auth-error',authFailure);
  loadMaps(import.meta.env.VITE_GOOGLE_MAPS_API_KEY).then(async maps=>{
   const {Map}=await maps.importLibrary('maps');await maps.importLibrary('marker');if(cancelled)return;
   map.current=new Map(node.current,{center,zoom:11,restriction:{latLngBounds:KANSAS_CITY_BOUNDS,strictBounds:true},mapId:import.meta.env.VITE_GOOGLE_MAPS_MAP_ID||'DEMO_MAP_ID',colorScheme:maps.ColorScheme.DARK,disableDefaultUI:true,zoomControl:true,gestureHandling:'cooperative'});setReady(true);
  }).catch(error=>{if(!cancelled)onError(error.message);});
  return()=>{cancelled=true;window.removeEventListener('sidequest-map-auth-error',authFailure);pins.current.forEach(pin=>pin.map=null);};
 },[]);
 useEffect(()=>{
  if(!ready)return;map.current.panTo(center);pins.current.forEach(pin=>pin.map=null);
  const maps=window.google.maps;
  const you=document.createElement('div');you.className='live-you-pin';
  const own=new maps.marker.AdvancedMarkerElement({map:map.current,position:center,content:you,title:'Kansas City center'});
  pins.current=[own,...events.map(event=>{
   const button=document.createElement('button');button.className=`live-event-pin ${event.accent} ${selected===event.id?'selected':''}`;button.textContent=event.live?'●':'✦';button.setAttribute('aria-label',event.title);
   button.addEventListener('click',()=>onSelect(event.id));
   return new maps.marker.AdvancedMarkerElement({map:map.current,position:event.position,content:button,title:event.title});
  })];
  return()=>pins.current.forEach(pin=>pin.map=null);
 },[ready,center,events,selected,onSelect]);
 return <div ref={node} className="google-event-map" aria-label="Google map of Kansas City events"/>;
}
function ConnectionAvatars({attendees}) {
 const [limit,setLimit]=useState(()=>window.matchMedia('(max-width:580px)').matches?5:6);
 useEffect(()=>{const media=window.matchMedia('(max-width:580px)'),update=()=>setLimit(media.matches?5:6);media.addEventListener('change',update);return()=>media.removeEventListener('change',update);},[]);
 if(!attendees.length)return null;
 return <div className="attending-connections" aria-label={`${attendees.length} connections attending`}>
  <div className="connection-avatar-stack">{attendees.slice(0,limit).map((person,index)=><img key={person.id} src={person.image} alt={person.name} title={person.name} style={{zIndex:limit-index}}/>)}</div>
  {attendees.length>limit&&<span className="connection-overflow" aria-label={`${attendees.length-limit} more connections attending`}>+{attendees.length-limit}</span>}
 </div>;
}
function WhosGoing({event,attendees,onClose}) {
 const dialog=useRef(null);
 useEffect(()=>{
  const previous=document.activeElement;const node=dialog.current;
  node.showModal();const overflow=document.body.style.overflow;document.body.style.overflow='hidden';
  return()=>{node.close();document.body.style.overflow=overflow;previous?.focus();};
 },[]);
 return <dialog ref={dialog} className="connections-dialog" aria-labelledby="whos-going-title" onCancel={onClose} onClick={e=>{if(e.target===dialog.current)onClose();}}>
  <div className="connections-dialog-content"><button className="connections-close" aria-label="Close who's going" onClick={onClose}><X size={20}/></button>
   <div className="eyebrow">GOOD COMPANY, ALREADY ON THE LIST</div><h2 id="whos-going-title">Who’s going</h2><p className="connections-event-title">{event.title}</p>
   <div className="connections-list-label"><Users size={15}/> Your connections <span>{attendees.length}</span></div>
   {attendees.length?<ul className="connections-attendee-list">{attendees.map(person=><li key={person.id}><img src={person.image} alt={person.name}/><div><strong>{person.name}</strong><span>@{person.handle}</span></div><span className="connection-going"><Check size={13}/> Going</span></li>)}</ul>:<p className="connections-empty">None of your connections have registered yet.</p>}
   <p className="connections-demo-label">Connections registered in Sidequest</p>
  </div>
 </dialog>;
}
export default function Events({notify,connections=[]}) {
 const [filter,setFilter]=useState('All events'),[query,setQuery]=useState(''),[selected,setSelected]=useState(null),[mapError,setMapError]=useState('');
 const [goingEvent,setGoingEvent]=useState(null),[limit,setLimit]=useState(20);
 useEffect(()=>setLimit(20),[center,filter,query]);
 const [now,setNow]=useState(()=>Date.now());
 const [listings,setListings]=useState([]),[eventLoading,setEventLoading]=useState(false),[eventError,setEventError]=useState(''),[warnings,setWarnings]=useState([]),[refresh,setRefresh]=useState(0);
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{
  const controller=new AbortController();setListings([]);setGoingEvent(null);setEventLoading(true);setEventError('');setWarnings([]);
  fetch('/api/events',{signal:controller.signal}).then(async response=>{
   const data=await response.json();if(!response.ok)throw new Error(data.error||'Could not load nearby events.');
   if(!Array.isArray(data.events))throw new Error('The event service returned an invalid response.');
   setListings(data.events);setWarnings(data.warnings||[]);
  }).catch(error=>{if(error.name!=='AbortError')setEventError(error.message);}).finally(()=>{if(!controller.signal.aborted)setEventLoading(false);});
  return()=>controller.abort();
 },[center,refresh]);
 useEffect(()=>{const timer=setInterval(()=>setRefresh(value=>value+1),5*60000);return()=>clearInterval(timer);},[]);
 const [joined,setJoined]=useState(()=>{try{const saved=JSON.parse(localStorage.getItem('sq-events'));return Array.isArray(saved)?saved:[];}catch{return [];}});
 useEffect(()=>{localStorage.setItem('sq-events',JSON.stringify(joined));},[joined]);
 const events=listings.map(event=>({...event,connections:connections.filter(person=>event.registeredIds?.includes(person.id)),live:eventStatus(event,now)==='live'})).filter(event=>['live','upcoming'].includes(eventStatus(event,now)));
 const matches=events.filter(event=>(filter==='All events'||(filter==='Live now'&&event.live)||(filter==='Upcoming'&&!event.live)||(filter==='My events'&&joined.includes(event.id)))&&`${event.title} ${event.type} ${event.venue}`.toLowerCase().includes(query.toLowerCase()));
 const visible=matches.slice(0,limit);
 const active=visible.find(event=>event.id===selected)||visible[0];
 const dialogEvent=events.find(event=>event.id===goingEvent);
 const toggleJoin=event=>{const attending=joined.includes(event.id);setJoined(current=>attending?current.filter(id=>id!==event.id):[...current,event.id]);notify(attending?'Removed from your plans.':'Saved to your plans on this device. Check the organizer for registration.');};
 const time=event=>new Date(event.start).toLocaleString(undefined,{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',...(event.timezone?{timeZone:event.timezone}:{})});
 const hasMap=!!import.meta.env.VITE_GOOGLE_MAPS_API_KEY&&!mapError;
 return <section className="events-page">
  <div className="page-heading events-heading"><div><div className="eyebrow">GOOD COMPANY. A LITTLE CLOSER.</div><h1>Kansas City sidequests<span>.</span></h1><p>Real concerts, meetups, rallies, and parades in Kansas City.</p></div><span className="location-lock"><MapPin size={17}/> Kansas City, MO · Location locked</span></div>
  <div className="events-toolbar"><div className="event-filters" aria-label="Filter events">{['All events','Live now','Upcoming','My events'].map(label=><button key={label} className={filter===label?'chosen':''} aria-pressed={filter===label} onClick={()=>setFilter(label)}>{label==='Live now'&&<span className="online-dot"/>}{label}{label==='My events'&&<small>{events.filter(event=>joined.includes(event.id)).length}</small>}</button>)}</div><label className="search event-search"><Search size={16}/><input aria-label="Search events" placeholder="Find your kind of event" value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
  {(eventLoading||eventError||warnings.length>0)&&<div className="event-feed-status" role="status">{eventLoading?'Finding Kansas City events…':eventError||warnings.join(' ')}{!eventLoading&&<button className="secondary" onClick={()=>setRefresh(value=>value+1)}>Try again</button>}</div>}
  <div className="events-layout"><div className="event-map-panel"><div className="event-map-top"><span><MapPin size={16}/>Kansas City, Missouri</span><small><span className="online-dot"/>{matches.length} events to discover</small></div><div className="event-map-canvas">{hasMap?<LiveMap center={center} events={visible} selected={active?.id} onSelect={setSelected} onError={setMapError}/>:<PreviewMap center={center} events={visible} selected={active?.id} onSelect={setSelected}/>}{active&&visible.some(event=>event.id===active.id)&&<div className="map-event-callout"><span className={`event-game-icon map-callout-image ${active.accent}`}>{active.image?<img src={active.image} alt="" onError={e=>{e.currentTarget.style.display='none';}}/>:<EventIcon type={active.type} size={21}/>}</span><div><small>{active.live?'HAPPENING NOW':'YOUR NEXT PLAN'}</small><strong>{active.title}</strong><span>{active.type} · {active.venue}</span></div><button aria-label={`View ${active.title} details`} onClick={()=>document.getElementById(`event-${active.id}`)?.scrollIntoView({behavior:'smooth',block:'center'})}><ArrowRight size={20}/></button></div>}</div><div className="event-map-foot"><LocateFixed size={14}/><span role="status">Kansas City, MO · Events restricted to city limits.</span></div>{(!hasMap)&&<p className="map-config-note">{mapError||'Map preview · Google Maps will appear when an API key is configured.'}</p>}</div>
  <div className="event-list"><div className="event-list-heading"><h2>A seat at the table<span>{matches.length}</span></h2><p>Kansas City city limits only · next 90 days</p></div>{visible.map(event=><article id={`event-${event.id}`} key={event.id} className={`event-card ${active?.id===event.id?'selected':''}`}><EventPhoto event={event}/><div className="event-card-top"><span className={`event-game-icon ${event.accent}`}><EventIcon type={event.type}/></span><span className="event-type">{event.type}<small>{event.source}</small></span><span className={`event-status ${event.live?'live':''}`}>{event.live?<><Radio size={12}/> Live now</>:<><CalendarDays size={12}/> Upcoming</>}</span></div><button className="event-title" onClick={()=>setSelected(event.id)}><h3>{event.title}</h3><ArrowUpRight size={17}/></button><p className="event-description">{event.description}</p><div className="event-info"><span><MapPin size={14}/>{event.venue}</span><span><Clock3 size={14}/>{time(event)}{event.end?` – ${new Date(event.end).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',...(event.timezone?{timeZone:event.timezone}:{})})}`:' · End time not published'}</span></div><div className="event-card-bottom"><div className="event-attendance"><span className="event-attendance-count"><Users size={15}/><strong>{event.connections.length+(joined.includes(event.id)?1:0)}</strong><span>going here</span></span><ConnectionAvatars attendees={event.connections}/><button className="secondary whos-going-button" onClick={()=>setGoingEvent(event.id)} aria-label={`Who’s going to ${event.title}: ${event.connections.length} connections`}><span className="whos-going-count">+{event.connections.length}</span><Users size={14}/> Who’s going</button></div><div className="event-rsvp-actions">{<a className="secondary event-organizer" href={event.url} target="_blank" rel="noreferrer">Event details <ArrowUpRight size={14}/></a>}<button className={joined.includes(event.id)?'secondary event-joined':'primary'} aria-pressed={joined.includes(event.id)} onClick={()=>toggleJoin(event)}>{joined.includes(event.id)?<><Check size={15}/> Saved · remove</>:<>Save plan <ArrowUpRight size={14}/></>}</button></div></div></article>)}{!visible.length&&!eventLoading&&!eventError&&<div className="event-empty"><CalendarDays size={30}/><h3>{filter==='My events'?'Your next plan is waiting.':'No Kansas City events found.'}</h3><p>{filter==='My events'?'Save an event and it’ll show up here.':'Try a different search or filter.'}</p><button className="secondary" onClick={()=>{setFilter('All events');setQuery('');}}>Explore events <ArrowRight size={15}/></button></div>}{matches.length>visible.length&&<button className="secondary event-load-more" onClick={()=>setLimit(value=>value+20)}>Show more events ({matches.length-visible.length} more) <ArrowRight size={15}/></button>}</div></div>
  {dialogEvent&&<WhosGoing event={dialogEvent} attendees={dialogEvent.connections} onClose={()=>setGoingEvent(null)}/>}
  <div className="events-demo-note"><span>✦</span><p><strong>A little offline. A lot of good company.</strong> Real listings from <a href="https://stungevents.com/" target="_blank" rel="noreferrer">StungEvents</a>, <a href="https://www.mobilize.us/" target="_blank" rel="noreferrer">Mobilize</a>, and connected organizers. Plans are saved on this device; tickets and registration happen with the organizer. Locations checked against <a href="https://mapd.kcmo.org/kcgis/rest/services/AGOL/MapServer/0" target="_blank" rel="noreferrer">Kansas City’s municipal boundary</a>. “Going here” only counts connections shown here and your saved plan.</p></div>
 </section>;
}
