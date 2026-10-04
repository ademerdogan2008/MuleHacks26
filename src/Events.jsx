import React, {useEffect, useRef, useState} from 'react';
import {MapPin, LocateFixed, ArrowUpRight, CalendarDays, Clock3, Users, Check, Search, Gamepad2, Radio, ArrowRight, X} from 'lucide-react';
import './events.css';

const fallbackLocation = {lat:41.8781,lng:-87.6298};
const templates = [
 {id:'lan',registeredIds:[0,1,2,3,4,5,10],title:'One more round.',game:'Valorant',type:'LAN night',venue:'The respawn lounge',offset:[.008,-.009],hours:-1,duration:4,attending:18,capacity:24,accent:'purple',description:'Bring your laptop, find your five, and queue with good company. All ranks welcome.'},
 {id:'build',registeredIds:[1,6,12],title:'Build something together.',game:'Minecraft',type:'Community meetup',venue:'Pixel community space',offset:[-.007,.012],hours:24,duration:3,attending:12,capacity:20,accent:'green',description:'A cozy afternoon of shared worlds and new friends. Bring your favorite build ideas.'},
 {id:'duos',registeredIds:[0,2,4,7,14],title:'Drop in. Link up.',game:'Fortnite',type:'Duos social',venue:'Next level gaming café',offset:[.016,.013],hours:48,duration:3,attending:22,capacity:32,accent:'blue',description:'Meet your next duo over casual games and friendly challenges. No sweaty tryouts required.'},
 {id:'social',registeredIds:[9,11,15],title:'Same games. New faces.',game:'All games',type:'Gaming social',venue:'Sidequest social club',offset:[-.015,-.014],hours:72,duration:2,attending:16,capacity:30,accent:'pink',description:'Take the party offline. Talk games, swap handles, and meet the people behind the players.'},
];
let mapsPromise;
function loadMaps(key) {
 if(window.google?.maps?.importLibrary)return Promise.resolve(window.google.maps);
 if(mapsPromise)return mapsPromise;
 mapsPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  const fail=()=>{clearTimeout(timer);reject(new Error('Google Maps couldn’t load. You can still explore the demo events.'));};
  const timer=setTimeout(fail,15000);
  window.sidequestMapsReady=()=>{clearTimeout(timer);resolve(window.google.maps);};
  window.gm_authFailure=()=>{fail();window.dispatchEvent(new Event('sidequest-map-auth-error'));};
  script.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&callback=sidequestMapsReady&v=weekly&libraries=marker`;
  script.async=true;script.onerror=fail;document.head.appendChild(script);
 }).catch(error=>{mapsPromise=undefined;throw error;});
 return mapsPromise;
}
function PreviewMap({events,selected,onSelect}) {
 return <div className="event-preview" aria-label="Illustrative neighborhood map with demo event pins">
  <svg viewBox="0 0 800 580" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><pattern id="blocks" width="110" height="90" patternTransform="rotate(-18)" patternUnits="userSpaceOnUse"><rect width="110" height="90" fill="#1e2230"/><rect x="10" y="10" width="87" height="66" rx="8" fill="#252a39" stroke="#2b3142"/><path d="M0 0H110M0 0V90" stroke="#3a4051" strokeWidth="7"/></pattern></defs><rect width="800" height="580" fill="url(#blocks)"/><path d="M680 -40Q480 130 620 290T620 650L900 650V-40Z" fill="#182f43"/><path d="M-50 400Q180 460 310 240T740 -30" fill="none" stroke="#525065" strokeWidth="16"/><path d="M-50 400Q180 460 310 240T740 -30" fill="none" stroke="#777085" strokeWidth="2" strokeDasharray="8 8"/><path d="M100 80L180 60L210 155L130 177Z M380 430L465 406L500 500L415 526Z" fill="#263b36"/></svg>
  <span className="preview-neighborhood">YOUR NEXT SIDEQUEST</span><span className="preview-water">LAKEFRONT</span>
  <div className="you-pin"><span/><small>You / preview center</small></div>
  {events.map(event=><button key={event.id} className={`event-pin ${event.accent} ${selected===event.id?'selected':''}`} style={{left:`${50+event.offset[1]*1600}%`,top:`${50-event.offset[0]*1600}%`}} aria-label={`Show ${event.title}`} onClick={()=>onSelect(event.id)}><Gamepad2 size={19}/>{event.live&&<i/>}</button>)}
  <span className="preview-label">Illustrative map · demo venues</span>
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
   map.current=new Map(node.current,{center,zoom:14,mapId:import.meta.env.VITE_GOOGLE_MAPS_MAP_ID||'DEMO_MAP_ID',colorScheme:maps.ColorScheme.DARK,disableDefaultUI:true,zoomControl:true,gestureHandling:'cooperative'});setReady(true);
  }).catch(error=>{if(!cancelled)onError(error.message);});
  return()=>{cancelled=true;window.removeEventListener('sidequest-map-auth-error',authFailure);pins.current.forEach(pin=>pin.map=null);};
 },[]);
 useEffect(()=>{
  if(!ready)return;map.current.panTo(center);pins.current.forEach(pin=>pin.map=null);
  const maps=window.google.maps;
  const you=document.createElement('div');you.className='live-you-pin';
  const own=new maps.marker.AdvancedMarkerElement({map:map.current,position:center,content:you,title:'Your location'});
  pins.current=[own,...events.map(event=>{
   const button=document.createElement('button');button.className=`live-event-pin ${event.accent} ${selected===event.id?'selected':''}`;button.textContent=event.live?'●':'✦';button.setAttribute('aria-label',event.title);
   button.addEventListener('click',()=>onSelect(event.id));
   return new maps.marker.AdvancedMarkerElement({map:map.current,position:event.position,content:button,title:event.title});
  })];
  return()=>pins.current.forEach(pin=>pin.map=null);
 },[ready,center,events,selected,onSelect]);
 return <div ref={node} className="google-event-map" aria-label="Google map of your location and demo events"/>;
}
function ConnectionAvatars({attendees}) {
 if(!attendees.length)return null;
 return <div className="attending-connections" aria-label={`${attendees.length} connections attending`}>
  <div className="connection-avatar-stack">{attendees.slice(0,4).map((person,index)=><img key={person.id} src={person.image} alt={person.name} title={person.name} style={{zIndex:4-index}}/>)}</div>
  {attendees.length>4&&<span className="connection-overflow" aria-label={`${attendees.length-4} more connections attending`}>+{attendees.length-4}</span>}
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
   <p className="connections-demo-label">Demo connections · sample registrations</p>
  </div>
 </dialog>;
}
export default function Events({notify,connections=[]}) {
 const [center,setCenter]=useState(fallbackLocation),[locationState,setLocationState]=useState('idle'),[locationNote,setLocationNote]=useState('Use your location to explore your neighborhood.'),[filter,setFilter]=useState('All events'),[query,setQuery]=useState(''),[selected,setSelected]=useState('lan'),[mapError,setMapError]=useState('');
 const [goingEvent,setGoingEvent]=useState(null);
 const [epoch]=useState(()=>Date.now());
 const [joined,setJoined]=useState(()=>{try{const saved=JSON.parse(localStorage.getItem('sq-events'));return Array.isArray(saved)?saved:[];}catch{return [];}});
 useEffect(()=>{localStorage.setItem('sq-events',JSON.stringify(joined));},[joined]);
 const requestLocation=()=>{
  if(!navigator.geolocation){setLocationState('unavailable');setLocationNote('Location is unavailable. Exploring the Chicago demo area.');return;}
  setLocationState('loading');setLocationNote('Finding your location…');
  navigator.geolocation.getCurrentPosition(({coords})=>{setCenter({lat:coords.latitude,lng:coords.longitude});setLocationState('located');setLocationNote('Centered on your current location.');},error=>{setLocationState('unavailable');setLocationNote(error.code===1?'Location access is off. Exploring the Chicago demo area.':'Couldn’t find your location. Exploring the Chicago demo area.');},{enableHighAccuracy:false,timeout:10000,maximumAge:60000});
 };
 useEffect(()=>{requestLocation();},[]);
 const events=templates.map(event=>({...event,connections:connections.filter(person=>event.registeredIds.includes(person.id)),live:event.hours<0,start:new Date(epoch+event.hours*3600000),position:{lat:center.lat+event.offset[0],lng:center.lng+event.offset[1]}}));
 const visible=events.filter(event=>(filter==='All events'||(filter==='Live now'&&event.live)||(filter==='Upcoming'&&!event.live)||(filter==='My events'&&joined.includes(event.id)))&&`${event.title} ${event.game} ${event.venue}`.toLowerCase().includes(query.toLowerCase()));
 const active=events.find(event=>event.id===selected);
 const toggleJoin=event=>{const attending=joined.includes(event.id);setJoined(current=>attending?current.filter(id=>id!==event.id):[...current,event.id]);notify(attending?'Your demo RSVP has been cancelled.':'You’re on the demo list! Your RSVP is saved on this device.');};
 const time=event=>event.start.toLocaleString(undefined,{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit'});
 const hasMap=!!import.meta.env.VITE_GOOGLE_MAPS_API_KEY&&!mapError;
 return <section className="events-page">
  <div className="page-heading events-heading"><div><div className="eyebrow">GOOD COMPANY. A LITTLE CLOSER.</div><h1>Your local sidequest<span>.</span></h1><p>Find your people around the corner. Show up. Play together.</p></div><button className="secondary location-button" onClick={requestLocation} disabled={locationState==='loading'}><LocateFixed size={17}/>{locationState==='loading'?'Locating…':'Use my location'}</button></div>
  <div className="events-toolbar"><div className="event-filters" aria-label="Filter events">{['All events','Live now','Upcoming','My events'].map(label=><button key={label} className={filter===label?'chosen':''} aria-pressed={filter===label} onClick={()=>setFilter(label)}>{label==='Live now'&&<span className="online-dot"/>}{label}{label==='My events'&&<small>{joined.length}</small>}</button>)}</div><label className="search event-search"><Search size={16}/><input aria-label="Search events" placeholder="Find your kind of event" value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
  <div className="events-layout"><div className="event-map-panel"><div className="event-map-top"><span><MapPin size={16}/>{locationState==='located'?'Your neighborhood':'Explore nearby'}</span><small><span className="online-dot"/>{visible.length} events to discover</small></div><div className="event-map-canvas">{hasMap?<LiveMap center={center} events={visible} selected={selected} onSelect={setSelected} onError={setMapError}/>:<PreviewMap events={visible} selected={selected} onSelect={setSelected}/>}{active&&visible.some(event=>event.id===active.id)&&<div className="map-event-callout"><span className={`event-game-icon ${active.accent}`}><Gamepad2 size={21}/></span><div><small>{active.live?'HAPPENING NOW':'YOUR NEXT PLAN'}</small><strong>{active.title}</strong><span>{active.game} · {active.attending+(joined.includes(active.id)?1:0)} going</span></div><button aria-label={`View ${active.title} details`} onClick={()=>document.getElementById(`event-${active.id}`)?.scrollIntoView({behavior:'smooth',block:'center'})}><ArrowRight size={20}/></button></div>}</div><div className="event-map-foot"><LocateFixed size={14}/><span role="status">{locationNote}</span></div>{(!hasMap)&&<p className="map-config-note">{mapError||'Map preview · Google Maps will appear when an API key is configured.'}</p>}</div>
  <div className="event-list"><div className="event-list-heading"><h2>A seat at the table<span>{visible.length}</span></h2><p>Your next party might be down the street.</p></div>{visible.map(event=><article id={`event-${event.id}`} key={event.id} className={`event-card ${selected===event.id?'selected':''}`}><div className="event-card-top"><span className={`event-game-icon ${event.accent}`}><Gamepad2 size={22}/></span><span className="event-type">{event.game}<small>{event.type}</small></span><span className={`event-status ${event.live?'live':''}`}>{event.live?<><Radio size={12}/> Live now</>:<><CalendarDays size={12}/> Upcoming</>}</span></div><button className="event-title" onClick={()=>setSelected(event.id)}><h3>{event.title}</h3><ArrowUpRight size={17}/></button><p className="event-description">{event.description}</p><div className="event-info"><span><MapPin size={14}/>{event.venue} · demo venue</span><span><Clock3 size={14}/>{time(event)} · {event.duration} hours</span></div><div className="event-card-bottom"><div className="event-attendance"><span className="event-attendance-count"><Users size={15}/><strong>{event.attending+(joined.includes(event.id)?1:0)}</strong> / {event.capacity} going</span><ConnectionAvatars attendees={event.connections}/></div><div className="event-rsvp-actions"><button className="secondary whos-going-button" onClick={()=>setGoingEvent(event.id)} aria-label={`Who’s going to ${event.title}: ${event.connections.length} connections`}><span className="whos-going-count">+{event.connections.length}</span><Users size={14}/> Who’s going</button><button className={joined.includes(event.id)?'secondary event-joined':'primary'} aria-pressed={joined.includes(event.id)} onClick={()=>toggleJoin(event)}>{joined.includes(event.id)?<><Check size={15}/> Going · cancel</>:<>Count me in <ArrowUpRight size={14}/></>}</button></div></div></article>)}{!visible.length&&<div className="event-empty"><CalendarDays size={30}/><h3>{filter==='My events'?'Your next plan is waiting.':'No events found.'}</h3><p>{filter==='My events'?'Join an event and it’ll show up here.':'Try a different search or filter.'}</p><button className="secondary" onClick={()=>{setFilter('All events');setQuery('');}}>Explore events <ArrowRight size={15}/></button></div>}</div></div>
  {goingEvent&&<WhosGoing event={events.find(event=>event.id===goingEvent)} attendees={events.find(event=>event.id===goingEvent).connections} onClose={()=>setGoingEvent(null)}/>}
  <div className="events-demo-note"><span>✦</span><p><strong>A little offline. A lot of good company.</strong> These are sample events and venues. Sign-ups are saved on this device; no real reservation is made.</p></div>
 </section>;
}
