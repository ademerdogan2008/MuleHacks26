import React, {useEffect, useRef, useState} from 'react';
import {createRoot} from 'react-dom/client';
import {MapPin, LocateFixed, ArrowUpRight, CalendarDays, Clock3, Users, Check, Search, Radio, ArrowRight, X, Music, Coffee, Megaphone, Flag, Sparkles, Locate} from 'lucide-react';
import './events.css';
import {INITIAL_MAP_RADIUS_MILES,MAX_MAP_RADIUS_MILES,zoomForRadius,boundsForRadius,clampPreviewView,zoomPreviewView} from './mapZoom.js';
import {eventStatus, KANSAS_CITY_CENTER} from './eventData.js';

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
function EventThumbnail({event}) {
 const [failed,setFailed]=useState(false);
 useEffect(()=>setFailed(false),[event.image]);
 return <span className="map-event-thumbnail">{event.image&&!failed?<img src={event.image} alt="" draggable={false} onError={()=>setFailed(true)}/>:<EventIcon type={event.type} size={22}/>}</span>;
}
function MapMarkerContent({event}) {
 const friends=event.connections.length;
 return <><EventThumbnail event={event}/><span className="map-friends-badge" title={`${friends} friends going`} aria-hidden="true">+{friends}</span>{event.live&&<span className="map-marker-live" aria-hidden="true"/>}</>;
}
function markerLabel(event) {
 return `Show ${event.title}: ${event.connections.length} friends going`;
}
let mapsPromise;
function loadMaps(key) {
 if(window.google?.maps?.importLibrary)return Promise.resolve(window.google.maps);
 if(mapsPromise)return mapsPromise;
 mapsPromise=new Promise((resolve,reject)=>{
  const script=document.createElement('script');
  const fail=()=>{clearTimeout(timer);reject(new Error('Google Maps couldn’t load. You can still explore the event list.'));};
  const timer=setTimeout(fail,15000);
  window.SocialQueueMapsReady=()=>{clearTimeout(timer);resolve(window.google.maps);};
  window.gm_authFailure=()=>{fail();window.dispatchEvent(new Event('SocialQueue-map-auth-error'));};
  script.src=`https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&loading=async&callback=SocialQueueMapsReady&v=weekly&libraries=marker`;
  script.async=true;script.onerror=fail;document.head.appendChild(script);
 }).catch(error=>{mapsPromise=undefined;throw error;});
 return mapsPromise;
}
function PreviewMap({center,events,selected,onSelect,resetView}) {
 const node=useRef(null),drag=useRef(null),[view,setView]=useState({scale:1,x:0,y:0}),[dragging,setDragging]=useState(false);
 useEffect(()=>setView({scale:1,x:0,y:0}),[resetView]);
 useEffect(()=>{
  const element=node.current;
  const wheel=event=>{
   event.preventDefault();const rect=element.getBoundingClientRect();
   const delta=event.deltaY*(event.deltaMode===1?16:event.deltaMode===2?rect.height:1);
   setView(current=>zoomPreviewView(current,delta,event.clientX-rect.left-rect.width/2,event.clientY-rect.top-rect.height/2,rect.width,rect.height));
  };
  element.addEventListener('wheel',wheel,{passive:false});
  const observer=new ResizeObserver(()=>setView(current=>clampPreviewView(current,element.clientWidth,element.clientHeight)));
  observer.observe(element);return()=>{element.removeEventListener('wheel',wheel);observer.disconnect();};
 },[]);
 const point=(x,y)=>({left:`calc(${50+(x-50)*view.scale}% + ${view.x}px)`,top:`calc(${50+(y-50)*view.scale}% + ${view.y}px)`});
 const endDrag=event=>{if(drag.current?.id!==event.pointerId)return;drag.current=null;setDragging(false);};
 return <div ref={node} className={`event-preview ${dragging?'dragging':''}`} tabIndex={0} aria-label="Illustrative Kansas City event map. Scroll to zoom; drag to move."
  onPointerDown={event=>{if(event.button!==0||event.target.closest('button'))return;node.current.setPointerCapture(event.pointerId);drag.current={id:event.pointerId,x:event.clientX,y:event.clientY,view};setDragging(true);}}
  onPointerMove={event=>{const start=drag.current;if(start?.id!==event.pointerId)return;setView(clampPreviewView({...start.view,x:start.view.x+event.clientX-start.x,y:start.view.y+event.clientY-start.y},node.current.clientWidth,node.current.clientHeight));}}
  onPointerUp={endDrag} onPointerCancel={endDrag} onLostPointerCapture={endDrag}
  onKeyDown={event=>{if(event.target!==node.current)return;const moves={ArrowLeft:[50,0],ArrowRight:[-50,0],ArrowUp:[0,50],ArrowDown:[0,-50]};if(moves[event.key]){event.preventDefault();setView(current=>clampPreviewView({...current,x:current.x+moves[event.key][0],y:current.y+moves[event.key][1]},node.current.clientWidth,node.current.clientHeight));}else if(['+','=','-'].includes(event.key)){event.preventDefault();setView(current=>zoomPreviewView(current,event.key==='-'?150:-150,0,0,node.current.clientWidth,node.current.clientHeight));}}}>
  <svg style={{transform:`translate(${view.x}px,${view.y}px) scale(${view.scale})`}} viewBox="0 0 800 580" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><pattern id="blocks" width="110" height="90" patternTransform="rotate(-18)" patternUnits="userSpaceOnUse"><rect width="110" height="90" fill="#1e2230"/><rect x="10" y="10" width="87" height="66" rx="8" fill="#252a39" stroke="#2b3142"/><path d="M0 0H110M0 0V90" stroke="#3a4051" strokeWidth="7"/></pattern></defs><rect x="-800" y="-580" width="2400" height="1740" fill="url(#blocks)"/><path d="M680 -40Q480 130 620 290T620 650L900 650V-40Z" fill="#182f43"/><path d="M-50 400Q180 460 310 240T740 -30" fill="none" stroke="#525065" strokeWidth="16"/><path d="M-50 400Q180 460 310 240T740 -30" fill="none" stroke="#777085" strokeWidth="2" strokeDasharray="8 8"/><path d="M100 80L180 60L210 155L130 177Z M380 430L465 406L500 500L415 526Z" fill="#263b36"/></svg>
  <span style={point(14,21)} className="preview-neighborhood">YOUR NEXT SocialQueue</span><span style={point(90,34)} className="preview-water">KANSAS CITY</span>
  <div style={point(50,50)} className="you-pin"><span/><small>Kansas City center</small></div>
  {events.map(event=><button key={event.id} className={`event-pin ${event.accent} ${selected===event.id?'selected':''}`} style={point(50+(event.position.lng-center.lng)*1600,50-(event.position.lat-center.lat)*1600)} aria-label={markerLabel(event)} aria-pressed={selected===event.id} onClick={()=>onSelect(event.id)}><MapMarkerContent event={event}/></button>)}
  <span className="preview-label">Illustrative map · not to scale</span>
 </div>;
}
function LiveMap({center,events,selected,onSelect,onError,resetView}) {
 const node=useRef(null),map=useRef(null),pins=useRef(new Map()),ownPin=useRef(null),[ready,setReady]=useState(false);
 useEffect(()=>{
  let cancelled=false;
  const authFailure=()=>onError('Google Maps couldn’t authenticate. Check the API key configuration.');
  window.addEventListener('SocialQueue-map-auth-error',authFailure);
  loadMaps(import.meta.env.VITE_GOOGLE_MAPS_API_KEY).then(async maps=>{
   const {Map}=await maps.importLibrary('maps');await maps.importLibrary('marker');if(cancelled)return;
   map.current=new Map(node.current,{center,zoom:11,restriction:{latLngBounds:boundsForRadius(center,MAX_MAP_RADIUS_MILES),strictBounds:true},mapId:import.meta.env.VITE_GOOGLE_MAPS_MAP_ID||'DEMO_MAP_ID',colorScheme:maps.ColorScheme.DARK,disableDefaultUI:true,zoomControl:false,gestureHandling:'greedy',scrollwheel:true,draggable:true,isFractionalZoomEnabled:true});setReady(true);
  }).catch(error=>{if(!cancelled)onError(error.message);});
  return()=>{cancelled=true;window.removeEventListener('SocialQueue-map-auth-error',authFailure);ownPin.current&&(ownPin.current.map=null);pins.current.forEach(({marker,root})=>{marker.map=null;root.unmount();});pins.current.clear();};
 },[]);
 useEffect(()=>{
  if(!ready)return;
  const update=()=>{
   const minZoom=zoomForRadius(node.current.clientWidth,node.current.clientHeight,center.lat,MAX_MAP_RADIUS_MILES);
   map.current.setOptions({minZoom});
   if(map.current.getZoom()<minZoom)map.current.setZoom(minZoom);
  };
  update();const observer=new ResizeObserver(update);observer.observe(node.current);
  return()=>observer.disconnect();
 },[ready,center]);
 useEffect(()=>{
  if(!ready)return;
  map.current.setCenter(center);
  map.current.setZoom(zoomForRadius(node.current.clientWidth,node.current.clientHeight,center.lat,INITIAL_MAP_RADIUS_MILES));
 },[ready,center,resetView]);
 useEffect(()=>{
  if(!ready)return;
  const maps=window.google.maps;
  if(!ownPin.current){
   const you=document.createElement('div');you.className='live-you-pin';
   ownPin.current=new maps.marker.AdvancedMarkerElement({map:map.current,position:center,content:you,title:'Kansas City center'});
  }
  const ids=new Set(events.map(event=>event.id));
  pins.current.forEach(({marker,root},id)=>{if(!ids.has(id)){marker.map=null;root.unmount();pins.current.delete(id);}});
  events.forEach(event=>{
   let pin=pins.current.get(event.id);
   if(!pin){
    const button=document.createElement('button'),root=createRoot(button);
    const marker=new maps.marker.AdvancedMarkerElement({map:map.current,position:event.position,content:button});
    pin={button,root,marker};pins.current.set(event.id,pin);
   }
   const isSelected=selected===event.id;
   pin.button.className=`live-event-pin ${event.accent} ${isSelected?'selected':''}`;
   pin.button.setAttribute('aria-label',markerLabel(event));pin.button.setAttribute('aria-pressed',String(isSelected));
   pin.button.onclick=()=>onSelect(event.id);
   pin.marker.position=event.position;pin.marker.title=markerLabel(event);pin.marker.zIndex=isSelected?1000:1;
   pin.root.render(<MapMarkerContent event={event}/>);
  });
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
   <p className="connections-demo-label">Connections registered in SocialQueue</p>
  </div>
 </dialog>;
}
export default function Events({notify,connections=[]}) {
 const [filter,setFilter]=useState('All events'),[query,setQuery]=useState(''),[selected,setSelected]=useState(null),[mapError,setMapError]=useState('');
 const [resetView,setResetView]=useState(0);
 const [goingEvent,setGoingEvent]=useState(null),[limit,setLimit]=useState(20);
 useEffect(()=>setLimit(20),[center,filter,query]);
 const [now,setNow]=useState(()=>Date.now());
 const [listings,setListings]=useState([]),[eventLoading,setEventLoading]=useState(false),[eventError,setEventError]=useState(''),[warnings,setWarnings]=useState([]),[refresh,setRefresh]=useState(0);
 useEffect(()=>{const timer=setInterval(()=>setNow(Date.now()),30000);return()=>clearInterval(timer);},[]);
 useEffect(()=>{
  const controller=new AbortController();setListings([]);setGoingEvent(null);setEventLoading(true);setEventError('');setWarnings([]);
  fetch('/api/events',{signal:controller.signal}).then(async response=>{
   if(!response.headers.get('content-type')?.includes('application/json'))throw new Error('The event service is unavailable. Refresh the app or try again.');
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
 const selectEvent=id=>{
  setSelected(id);
  requestAnimationFrame(()=>{
   const card=document.getElementById(`event-${id}`);
   card?.scrollIntoView({behavior:window.matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'center'});
   card?.querySelector('.event-organizer')?.focus({preventScroll:true});
  });
 };
 const toggleJoin=event=>{const attending=joined.includes(event.id);setJoined(current=>attending?current.filter(id=>id!==event.id):[...current,event.id]);notify(attending?'Removed from your plans.':'Saved to your plans on this device. Check the organizer for registration.');};
 const time=event=>new Date(event.start).toLocaleString(undefined,{weekday:'short',month:'short',day:'numeric',hour:'numeric',minute:'2-digit',...(event.timezone?{timeZone:event.timezone}:{})});
 const hasMap=!!import.meta.env.VITE_GOOGLE_MAPS_API_KEY&&!mapError;
 return <section className="events-page">
  <div className="page-heading events-heading"><div><div className="eyebrow">GOOD COMPANY. A LITTLE CLOSER.</div><h1>Kansas City SocialQueue events<span>.</span></h1><p>Real concerts, meetups, rallies, and parades in Kansas City.</p></div><span className="location-lock"><MapPin size={17}/> Kansas City, MO · Location locked</span></div>
  <div className="events-toolbar"><div className="event-filters" aria-label="Filter events">{['All events','Live now','Upcoming','My events'].map(label=><button key={label} className={filter===label?'chosen':''} aria-pressed={filter===label} onClick={()=>setFilter(label)}>{label==='Live now'&&<span className="online-dot"/>}{label}{label==='My events'&&<small>{events.filter(event=>joined.includes(event.id)).length}</small>}</button>)}</div><label className="search event-search"><Search size={16}/><input aria-label="Search events" placeholder="Find your kind of event" value={query} onChange={e=>setQuery(e.target.value)}/></label></div>
  {(eventLoading||eventError||warnings.length>0)&&<div className="event-feed-status" role="status">{eventLoading?'Finding Kansas City events…':eventError||warnings.join(' ')}{!eventLoading&&<button className="secondary" onClick={()=>setRefresh(value=>value+1)}>Try again</button>}</div>}
  <div className="events-layout"><div className="event-map-panel"><div className="event-map-top"><span><MapPin size={16}/>Kansas City, Missouri</span><small><span className="online-dot"/>{matches.length} events to discover</small></div><div className="event-map-canvas"><div className="map-zoom-controls"><button onClick={()=>setResetView(value=>value+1)} aria-label="Reset Kansas City map view"><Locate size={17}/> Reset view</button></div>{hasMap?<LiveMap resetView={resetView} center={center} events={visible} selected={active?.id} onSelect={selectEvent} onError={setMapError}/>:<PreviewMap resetView={resetView} center={center} events={visible} selected={active?.id} onSelect={selectEvent}/>}{active&&visible.some(event=>event.id===active.id)&&<div className="map-event-callout"><span className={`event-game-icon map-callout-image ${active.accent}`}><EventThumbnail key={active.id} event={active}/></span><div><small>{active.live?'HAPPENING NOW':'YOUR NEXT PLAN'}</small><strong>{active.title}</strong><span>{active.type} · {active.venue}</span></div><button aria-label={`Show sign-up for ${active.title}`} onClick={()=>selectEvent(active.id)}><ArrowRight size={20}/></button></div>}</div><div className="event-map-foot"><LocateFixed size={14}/><span role="status">Scroll to zoom · Drag to move · Zoom out up to 50 extra miles. Events stay in Kansas City.</span></div>{(!hasMap)&&<p className="map-config-note">{mapError||'Map preview · Google Maps will appear when an API key is configured.'}</p>}</div>
  <div className="event-list"><div className="event-list-heading"><h2>A seat at the table<span>{matches.length}</span></h2><p>Kansas City city limits only · next 90 days</p></div>{visible.map(event=><article id={`event-${event.id}`} key={event.id} className={`event-card ${active?.id===event.id?'selected':''}`}><EventPhoto event={event}/><div className="event-card-top"><span className={`event-game-icon ${event.accent}`}><EventIcon type={event.type}/></span><span className="event-type">{event.type}<small>{event.source}</small></span><span className={`event-status ${event.live?'live':''}`}>{event.live?<><Radio size={12}/> Live now</>:<><CalendarDays size={12}/> Upcoming</>}</span></div><button className="event-title" onClick={()=>selectEvent(event.id)}><h3>{event.title}</h3><ArrowUpRight size={17}/></button><p className="event-description">{event.description}</p><div className="event-info"><span><MapPin size={14}/>{event.venue}</span><span><Clock3 size={14}/>{time(event)}{event.end?` – ${new Date(event.end).toLocaleString(undefined,{month:'short',day:'numeric',hour:'numeric',minute:'2-digit',...(event.timezone?{timeZone:event.timezone}:{})})}`:' · End time not published'}</span></div><div className="event-card-bottom"><div className="event-attendance"><span className="event-attendance-count"><Users size={15}/><strong>{event.connections.length+(joined.includes(event.id)?1:0)}</strong><span>going here</span></span><ConnectionAvatars attendees={event.connections}/><button className="secondary whos-going-button" onClick={()=>setGoingEvent(event.id)} aria-label={`Who’s going to ${event.title}: ${event.connections.length} connections`}><span className="whos-going-count">+{event.connections.length}</span><Users size={14}/> Who’s going</button></div><div className="event-rsvp-actions">{<a className="secondary event-organizer" href={event.url} target="_blank" rel="noreferrer" aria-label={`Sign up for ${event.title} with the organizer`}>Sign up <ArrowUpRight size={14}/></a>}<button className={joined.includes(event.id)?'secondary event-joined':'primary'} aria-pressed={joined.includes(event.id)} onClick={()=>toggleJoin(event)}>{joined.includes(event.id)?<><Check size={15}/> Saved · remove</>:<>Save plan <ArrowUpRight size={14}/></>}</button></div></div></article>)}{!visible.length&&!eventLoading&&!eventError&&<div className="event-empty"><CalendarDays size={30}/><h3>{filter==='My events'?'Your next plan is waiting.':'No Kansas City events found.'}</h3><p>{filter==='My events'?'Save an event and it’ll show up here.':'Try a different search or filter.'}</p><button className="secondary" onClick={()=>{setFilter('All events');setQuery('');}}>Explore events <ArrowRight size={15}/></button></div>}{matches.length>visible.length&&<button className="secondary event-load-more" onClick={()=>setLimit(value=>value+20)}>Show more events ({matches.length-visible.length} more) <ArrowRight size={15}/></button>}</div></div>
  {dialogEvent&&<WhosGoing event={dialogEvent} attendees={dialogEvent.connections} onClose={()=>setGoingEvent(null)}/>}
  <div className="events-demo-note"><span>✦</span><p><strong>A little offline. A lot of good company.</strong> Real listings from <a href="https://stungevents.com/" target="_blank" rel="noreferrer">StungEvents</a>, <a href="https://www.mobilize.us/" target="_blank" rel="noreferrer">Mobilize</a>, and connected organizers. Plans are saved on this device; tickets and registration happen with the organizer. Locations checked against <a href="https://mapd.kcmo.org/kcgis/rest/services/AGOL/MapServer/0" target="_blank" rel="noreferrer">Kansas City’s municipal boundary</a>. “Going here” only counts connections shown here and your saved plan.</p></div>
 </section>;
}
