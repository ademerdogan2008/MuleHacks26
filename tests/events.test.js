import test from 'node:test';
import assert from 'node:assert/strict';
import {eventStatus,nearbyEvents,normalizeEvent,normalizeTicketmaster,geohash,normalizeStungEvent,normalizeMobilizeEvent,KANSAS_CITY_CENTER} from '../src/eventData.js';
import {createEventsHandler} from '../server/events.js';
import {isInKansasCity} from '../server/eventScope.js';
const center=KANSAS_CITY_CENTER,now=Date.parse('2026-10-04T02:30:00Z');
const raw={id:'1',title:'Local parade',type:'Parade',position:center,start:'2026-10-04T02:00:00Z',end:'2026-10-04T04:00:00Z',url:'https://example.org/event'};

test('live requires an explicit future end; ended, cancelled, unsafe and unlocated events are excluded',()=>{
 const event=normalizeEvent(raw);
 assert.equal(eventStatus(event,now),'live');
 assert.equal(eventStatus(event,Date.parse(raw.end)),'ended');
 assert.equal(eventStatus({...event,end:null},now),'started');
 assert.equal(normalizeEvent({...raw,status:'cancelled'}),null);
 assert.equal(normalizeEvent({...raw,url:'javascript:alert(1)'}),null);
 assert.equal(normalizeEvent({...raw,position:{lat:NaN,lng:0}}),null);
 assert.equal(normalizeEvent({...raw,end:raw.start}),null);
 assert.equal(nearbyEvents([event,{...event,id:'far',position:{lat:0,lng:0}}, {...event,id:'past',end:raw.start}],center,now).length,1);
});
test('Ticketmaster listings preserve fixed coordinates and times and omit unknown schedules',()=>{
 const tm={id:'abc',name:'Concert',url:raw.url,dates:{start:{dateTime:raw.start},end:{dateTime:raw.end},status:{code:'onsale'}},classifications:[{segment:{name:'Music'}}],_embedded:{venues:[{name:'Hall',location:{latitude:String(center.lat),longitude:String(center.lng)}}]}};
 const event=normalizeTicketmaster(tm);
 assert.equal(event.type,'Concert');assert.deepEqual(event.position,center);assert.deepEqual(event.registeredIds,[]);
 assert.equal(normalizeTicketmaster({...tm,dates:{...tm.dates,start:{dateTBD:true}}}),null);
 assert.equal(geohash({lat:42.6,lng:-5.6}).slice(0,5),'ezs42');
});
async function request(handler,path){let status,body;await handler({url:path,method:'GET'},{writeHead(code){status=code;},end(data){body=JSON.parse(data);}});return {status,body};}
test('event API stays locked and preserves available sources during provider failures',async()=>{

 assert.equal((await request(createEventsHandler({},async()=>{throw new Error('Offline');}),'/api/events?lat=0&lng=0')).status,502);
 const future={...raw,start:new Date(Date.now()+86400000).toISOString(),end:new Date(Date.now()+90000000).toISOString()};
 const handler=createEventsHandler({TICKETMASTER_API_KEY:'test-key',COMMUNITY_EVENTS_URL:'https://example.org/feed'},async url=>{
  if(!String(url).startsWith('https://example.org/feed'))throw new Error('Unavailable');
  return {ok:true,json:async()=>({events:[future]})};
 });
 const result=await request(handler,`/api/events?lat=${center.lat}&lng=${center.lng}`);
 assert.equal(result.status,200);assert.equal(result.body.events.length,1);assert.deepEqual(result.body.warnings,['StungEvents events could not be loaded.','Mobilize events could not be loaded.','Ticketmaster events could not be loaded.']);
});

test('real-source normalizers preserve organizer photos and never invent coordinates or attendees',()=>{
 const stung=normalizeStungEvent({id:'real',title:'Actual concert',start_utc:raw.start,end_utc:raw.end,latitude:center.lat,longitude:center.lng,ticket_url:raw.url,venue_name:'Hall',city:'Chicago',category:'concerts',image_url:'https://example.org/concert.jpg'});
 assert.equal(stung.image,'https://example.org/concert.jpg');assert.equal(stung.type,'Concert');assert.deepEqual(stung.registeredIds,[]);
 assert.equal(normalizeStungEvent({id:'no-location',title:'No location',start_utc:raw.start,ticket_url:raw.url}),null);
 assert.equal(normalizeEvent({...raw,image:'javascript:alert(1)'}).image,null);
 const civic={id:33,title:'Community rally',visibility:'PUBLIC',address_visibility:'PUBLIC',is_virtual:false,location:{venue:'Square',locality:'Chicago',location:{latitude:center.lat,longitude:center.lng}},timeslots:[{id:44,start_date:Date.parse(raw.start)/1000,end_date:Date.parse(raw.end)/1000}],browser_url:raw.url,featured_image_url:'https://example.org/rally.jpg',event_type:'RALLY'};
 const rally=normalizeMobilizeEvent(civic,now);assert.equal(rally.image,civic.featured_image_url);assert.equal(rally.type,'Rally');assert.equal(eventStatus(rally,now),'live');
 assert.equal(normalizeMobilizeEvent({...civic,is_virtual:true},now),null);
 assert.equal(normalizeMobilizeEvent({...civic,address_visibility:'PRIVATE'},now),null);
 assert.equal(normalizeMobilizeEvent(civic,Date.parse(raw.end)),null);
});
test('keyless feeds use Kansas City exclusively, reject other cities, and cache locked results',async()=>{
 const future={...raw,start:new Date(Date.now()+86400000).toISOString(),end:new Date(Date.now()+90000000).toISOString()};let calls=0;
 const handler=createEventsHandler({},async value=>{
  calls++;const url=new URL(value);let data;
  if(url.host.includes('stungevents')){
   assert.equal(url.searchParams.get('city'),'Kansas City');
   data={events:[{id:11,title:future.title,start_utc:future.start,end_utc:future.end,latitude:center.lat,longitude:center.lng,ticket_url:future.url,image_url:'https://example.org/photo.jpg'}, {id:12,title:'Distant',start_utc:future.start,latitude:0,longitude:0,ticket_url:future.url}, {id:13,title:'Suburban listing',start_utc:future.start,latitude:38.9822,longitude:-94.6708,ticket_url:future.url}]};
  }else {assert.equal(url.searchParams.get('zipcode'),'64106');assert.equal(url.searchParams.get('is_virtual'),'false');data={data:[],next:null};}
  return {ok:true,json:async()=>data};
 });
 const path=`/api/events?lat=${center.lat}&lng=${center.lng}`,response=await request(handler,path);
 assert.equal(response.status,200);assert.equal(response.body.events.length,1);assert.equal(response.body.events[0].image,'https://example.org/photo.jpg');assert.deepEqual(response.body.warnings,[]);
 const foreign=await request(handler,'/api/events?lat=41.8781&lng=-87.6298&city=Chicago');assert.equal(calls,3);assert.equal(foreign.body.location.city,'Kansas City');assert.equal(foreign.body.location.locked,true);assert.deepEqual(foreign.body.events,response.body.events);
});

test('municipal boundary excludes Kansas City suburbs and the Kansas side, including enclaves',()=>{
 assert.equal(isInKansasCity(KANSAS_CITY_CENTER),true);
 assert.equal(isInKansasCity({lat:39.0973,lng:-94.5799}),true); // T-Mobile Center
 for(const position of [
  {lat:38.9822,lng:-94.6708}, // Overland Park, KS
  {lat:39.1142,lng:-94.6275}, // Kansas City, KS
  {lat:39.0911,lng:-94.4155}, // Independence, MO
  {lat:39.2461,lng:-94.4191}, // Liberty, MO
  {lat:39.2039,lng:-94.5547}, // Gladstone enclave
  {lat:39.143,lng:-94.5724}, // North Kansas City enclave
  {lat:38.9956,lng:-94.4641}, // Raytown
  {lat:41.8781,lng:-87.6298}, // Chicago
 ])assert.equal(isInKansasCity(position),false,JSON.stringify(position));
});
