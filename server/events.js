import {isInKansasCity} from './eventScope.js';
import {KANSAS_CITY_CENTER, EVENT_RADIUS_MILES, EVENT_WINDOW_DAYS, geohash, nearbyEvents, normalizeEvent, normalizeTicketmaster, normalizeStungEvent, normalizeMobilizeEvent} from '../src/eventData.js';

export function createEventsHandler(env=process.env, fetcher=fetch) {
 const cache=new Map(),cityFeeds=new Map();
 const read=async endpoint=>{const response=await fetcher(endpoint,{signal:AbortSignal.timeout(12000),headers:{'User-Agent':'SocialQueue-LocalEvents/1.0'}});if(!response.ok)throw new Error('Provider unavailable');return response.json();};
 return async function eventsHandler(req,res,next) {
  const url=new URL(req.url,'http://localhost');
  if(url.pathname!=='/api/events'){next?.();return;}
  const send=(code,data)=>{res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store'});res.end(JSON.stringify(data));};
  if(req.method!=='GET')return send(405,{error:'Method not allowed.'});
  // This endpoint is location locked. Caller-supplied coordinates and city parameters cannot change it.
  const center=KANSAS_CITY_CENTER,{lat,lng}=center,key='kansas-city-mo',cached=cache.get(key),now=Date.now();
  if(cached&&cached.expires>now)return send(200,{...cached.data,events:nearbyEvents(cached.data.events,center,now).filter(event=>isInKansasCity(event.position))});
  const area={city:'Kansas City',postcode:'64106',country:'US'};
  const providers=[{name:'StungEvents',load:async()=>{
   const cityKey=`${area.city}:${area.country||''}`,saved=cityFeeds.get(cityKey);
   if(saved&&saved.expires>now)return saved.promise;
   const promise=(async()=>{
    const endpoint=new URL('https://api.stungevents.com/events');
    endpoint.search=new URLSearchParams({city:area.city,limit:'100',...(area.country?{country:area.country}:{})}).toString();
    const rows=[];
    // Query upcoming starts separately so past listings cannot consume the upcoming result limit.
    for(const range of [{from:now,to:now+EVENT_WINDOW_DAYS*86400000,pages:2},{from:now-7*86400000,to:now,pages:3}]){
     endpoint.searchParams.set('from',new Date(range.from).toISOString());endpoint.searchParams.set('to',new Date(range.to).toISOString());
     for(let page=0;page<range.pages;page++){endpoint.searchParams.set('offset',String(page*100));const data=await read(endpoint);
      if(!Array.isArray(data.events))throw new Error('Invalid feed');rows.push(...data.events);if(data.events.length<100)break;
     }
    }
    return rows.map(normalizeStungEvent);
   })();
   if(cityFeeds.size>=100)cityFeeds.delete(cityFeeds.keys().next().value);
   cityFeeds.set(cityKey,{promise,expires:now+10*60000});
   try{return await promise;}catch(error){cityFeeds.delete(cityKey);throw error;}
  }},{name:'Mobilize',load:async()=>{
   const endpoint=new URL('https://api.mobilize.us/v1/organizations/1/events');
   endpoint.search=new URLSearchParams({zipcode:area.postcode,max_dist:String(EVENT_RADIUS_MILES),timeslot_end:`gte_${Math.floor(now/1000)}`,timeslot_start:`lte_${Math.floor((now+EVENT_WINDOW_DAYS*86400000)/1000)}`,is_virtual:'false',visibility:'PUBLIC',per_page:'100',state:'MO'}).toString();
   const rows=[];let next=endpoint;
   for(let page=0;page<3&&next;page++){
    const data=await read(next);if(!Array.isArray(data.data))throw new Error('Invalid feed');rows.push(...data.data);
    next=data.next?new URL(data.next):null;
    if(next&&(next.origin!==endpoint.origin||next.pathname!==endpoint.pathname))throw new Error('Invalid pagination');
   }
   return rows.map(raw=>normalizeMobilizeEvent(raw,now));
  }}];
  if(env.TICKETMASTER_API_KEY)providers.push({name:'Ticketmaster',load:async()=>{
   const endpoint=new URL('https://app.ticketmaster.com/discovery/v2/events.json');
   const iso=ms=>new Date(ms).toISOString().replace('.000Z','Z');
   endpoint.search=new URLSearchParams({apikey:env.TICKETMASTER_API_KEY,geoPoint:geohash(center),radius:String(EVENT_RADIUS_MILES),unit:'miles',city:'Kansas City',stateCode:'MO',
    startEndDateTime:`${iso(now)},${iso(now+EVENT_WINDOW_DAYS*86400000)}`,size:'200',sort:'date,asc',includeTBA:'no',includeTBD:'no'}).toString();
   const first=await read(endpoint);const rows=[...(first._embedded?.events||[])];
   // Discovery supports deep paging only within the first 1,000 results.
   for(let page=1;page<Math.min(first.page?.totalPages||1,5);page++){endpoint.searchParams.set('page',String(page));const data=await read(endpoint);rows.push(...(data._embedded?.events||[]));}
   return rows.map(normalizeTicketmaster);
  }});
  if(env.COMMUNITY_EVENTS_URL)providers.push({name:'Community',load:async()=>{
   const endpoint=new URL(env.COMMUNITY_EVENTS_URL);
   if(!['https:','http:'].includes(endpoint.protocol))throw new Error('Invalid feed');
   endpoint.searchParams.set('city','Kansas City');endpoint.searchParams.set('state','MO');
   endpoint.searchParams.set('lat',String(lat));endpoint.searchParams.set('lng',String(lng));endpoint.searchParams.set('radius',String(EVENT_RADIUS_MILES));
   const data=await read(endpoint);const rows=Array.isArray(data)?data:data.events;
   if(!Array.isArray(rows))throw new Error('Invalid feed');return rows.map(raw=>normalizeEvent(raw));
  }});
  const results=await Promise.allSettled(providers.map(provider=>provider.load()));
  const successful=results.filter(result=>result.status==='fulfilled');
  if(!successful.length)return send(502,{error:'Event providers are unavailable right now. Please try again.'});
  const data={events:nearbyEvents(successful.flatMap(result=>result.value),center,now).filter(event=>isInKansasCity(event.position)),warnings:results.flatMap((result,index)=>result.status==='rejected'?[`${providers[index].name} events could not be loaded.`]:[]),updatedAt:new Date(now).toISOString(),location:{city:'Kansas City',state:'MO',center,locked:true},sources:providers.filter((_,index)=>results[index].status==='fulfilled').map(provider=>provider.name)};
  if(cache.size>=100)cache.delete(cache.keys().next().value);
  cache.set(key,{data,expires:now+(data.warnings.length?30000:5*60000)});
  send(200,data);
 };
}
