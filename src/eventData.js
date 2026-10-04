export const KANSAS_CITY_CENTER = Object.freeze({lat:39.0997,lng:-94.5786});
export const KANSAS_CITY_BOUNDS = Object.freeze({west:-94.765646,east:-94.385368,south:38.824715,north:39.356368});
export const EVENT_RADIUS_MILES = 50;
export const EVENT_WINDOW_DAYS = 90;

export function distanceFrom(center, position) {
 const r = n => n * Math.PI / 180;
 const a = Math.sin(r(position.lat-center.lat)/2)**2 + Math.cos(r(center.lat))*Math.cos(r(position.lat))*Math.sin(r(position.lng-center.lng)/2)**2;
 return 3958.7613 * 2 * Math.asin(Math.sqrt(Math.min(1,a)));
}
export function safeUrl(value) {
 try {const url=new URL(value);return ['https:','http:'].includes(url.protocol)?url.href:null;} catch {return null;}
}
export function normalizeEvent(raw, source='Community') {
 const start=Date.parse(raw.start),end=raw.end?Date.parse(raw.end):null;
 const position=raw.position;
 let timezone;try{if(raw.timezone){new Intl.DateTimeFormat('en',{timeZone:raw.timezone});timezone=raw.timezone;}}catch{timezone=undefined;}
 if(!raw.id || !raw.title || !Number.isFinite(start) || (raw.end && (!Number.isFinite(end)||end<=start)) ||
  !position || !Number.isFinite(position.lat) || !Number.isFinite(position.lng) || Math.abs(position.lat)>90 || Math.abs(position.lng)>180 ||
  !safeUrl(raw.url) || ['cancelled','canceled','postponed'].includes(raw.status?.toLowerCase()))return null;
 return {id:`${source.toLowerCase()}:${raw.id}`,title:String(raw.title),start:new Date(start).toISOString(),end:end?new Date(end).toISOString():null,
  position,url:safeUrl(raw.url),image:safeUrl(raw.image),venue:String(raw.venue||'See organizer for venue'),type:String(raw.type||'Community event'),
  description:plainText(raw.description).slice(0,360),source,timezone,registeredIds:[],accent:raw.type==='Concert'?'purple':raw.type==='Meetup'?'green':raw.type==='Parade'?'pink':'blue'};
}
export function normalizeTicketmaster(raw) {
 const venue=raw._embedded?.venues?.[0],classification=raw.classifications?.[0];
 if(raw.dates?.start?.dateTBD||raw.dates?.start?.dateTBA||raw.dates?.start?.timeTBA)return null;
 return normalizeEvent({id:raw.id,title:raw.name,start:raw.dates?.start?.dateTime,end:raw.dates?.end?.dateTime,
  status:raw.dates?.status?.code,position:{lat:Number(venue?.location?.latitude),lng:Number(venue?.location?.longitude)},
  url:raw.url,venue:[venue?.name,venue?.city?.name].filter(Boolean).join(' · '),
  type:classification?.segment?.name==='Music'?'Concert':classification?.segment?.name||'Event',
  description:raw.info||raw.pleaseNote||'',timezone:raw.dates?.timezone,image:raw.images?.filter(image=>image.ratio==='16_9').sort((a,b)=>b.width-a.width)[0]?.url||raw.images?.[0]?.url},'Ticketmaster');
}
export function eventStatus(event, now=Date.now()) {
 const start=Date.parse(event.start),end=event.end?Date.parse(event.end):null;
 if(end!==null&&end<=now)return 'ended';
 if(start>now)return 'upcoming';
 return end!==null?'live':'started'; // Never invent an end time or claim an event is live without one.
}
export function nearbyEvents(events,center,now=Date.now()) {
 return [...new Map(events.filter(Boolean).filter(event=>distanceFrom(center,event.position)<=EVENT_RADIUS_MILES &&
  Date.parse(event.start)<=now+EVENT_WINDOW_DAYS*86400000 && (eventStatus(event,now)==='live'||eventStatus(event,now)==='upcoming')).map(event=>[event.id,event])).values()]
  .sort((a,b)=>Date.parse(a.start)-Date.parse(b.start));
}
// Ticketmaster's geoPoint uses a geohash instead of the deprecated latlong filter.
export function geohash({lat,lng}) {
 const alphabet='0123456789bcdefghjkmnpqrstuvwxyz';let hash='',bits=0,value=0,longitude=true;
 const bounds={lat:[-90,90],lng:[-180,180]};
 while(hash.length<9){const key=longitude?'lng':'lat',range=bounds[key],mid=(range[0]+range[1])/2,upper=(longitude?lng:lat)>=mid;
  value=(value<<1)+(upper?1:0);range[upper?0:1]=mid;longitude=!longitude;
  if(++bits===5){hash+=alphabet[value];bits=0;value=0;}}
 return hash;
}

export function plainText(value) {
 return String(value||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&nbsp;/g,' ').replace(/&quot;/g,'"').replace(/&#(?:39|x27);/g,"'").replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/\s+/g,' ').trim();
}
export function normalizeStungEvent(raw) {
 let schema={};try{schema=JSON.parse(raw.raw_schema_json||'{}');}catch{/* Optional source metadata. */}
 const type={concerts:'Concert',festivals:'Festival',community:'Meetup',performing_arts:'Performing arts',sports:'Sports',tech:'Meetup',film:'Film'}[raw.category]||plainText(raw.category).replaceAll('_',' ')||'Event';
 return normalizeEvent({id:raw.id,title:raw.title,start:raw.start_utc,end:raw.end_utc,
  position:{lat:raw.latitude,lng:raw.longitude},url:raw.ticket_url,venue:[raw.venue_name,raw.city].filter(Boolean).join(' · '),
  description:plainText(raw.description||schema.description).slice(0,360),type,status:raw.status,timezone:raw.timezone||raw.venue_timezone,
  image:raw.image_url||(Array.isArray(schema.image)?schema.image[0]:schema.image)},'StungEvents');
}
export function normalizeMobilizeEvent(raw,now=Date.now()) {
 if(raw.is_virtual || raw.visibility!=='PUBLIC' || raw.address_visibility!=='PUBLIC')return null;
 const coords=raw.location?.location;
 const slot=raw.timeslots?.filter(slot=>Number.isFinite(slot.start_date)&&Number.isFinite(slot.end_date)&&slot.end_date*1000>now).sort((a,b)=>a.start_date-b.start_date)[0];
 if(!slot||!coords)return null;
 const type={RALLY:'Rally',MEETING:'Meetup',COMMUNITY:'Community event',SOCIAL:'Meetup',MARCH:'March',TRAINING:'Workshop',CANVASS:'Volunteer event'}[raw.event_type]||'Community event';
 return normalizeEvent({id:`${raw.id}:${slot.id}`,title:raw.title,start:new Date(slot.start_date*1000).toISOString(),end:new Date(slot.end_date*1000).toISOString(),
  position:{lat:coords.latitude,lng:coords.longitude},url:raw.browser_url,venue:[raw.location.venue||raw.location.address_lines?.filter(Boolean).join(', '),raw.location.locality].filter(Boolean).join(' · '),
  description:plainText(raw.summary||raw.description).slice(0,360),type,timezone:raw.timezone,image:raw.featured_image_url},'Mobilize');
}
