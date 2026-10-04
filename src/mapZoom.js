export const INITIAL_MAP_RADIUS_MILES = 25;
export const EXTRA_MAP_RADIUS_MILES = 50;
export const MAX_MAP_RADIUS_MILES = INITIAL_MAP_RADIUS_MILES + EXTRA_MAP_RADIUS_MILES;
const METERS_PER_MILE = 1609.344;

export function clampPreviewView(view,width,height) {
 const scale=Math.max(INITIAL_MAP_RADIUS_MILES/MAX_MAP_RADIUS_MILES,Math.min(8,view.scale));
 const xLimit=Math.max(0,width*(1.5*scale-.5));
 const yLimit=Math.max(0,height*(1.5*scale-.5));
 return {scale,x:Math.max(-xLimit,Math.min(xLimit,view.x)),y:Math.max(-yLimit,Math.min(yLimit,view.y))};
}
export function zoomPreviewView(view,delta,x,y,width,height) {
 const scale=clampPreviewView({...view,scale:view.scale*Math.exp(-Math.max(-300,Math.min(300,delta))*.002)},width,height).scale;
 const ratio=scale/view.scale;
 return clampPreviewView({scale,x:x-(x-view.x)*ratio,y:y-(y-view.y)*ratio},width,height);
}

// Limit the viewport's diagonal radius, so wide or tall screens cannot zoom out farther.
export function zoomForRadius(width,height,latitude,radiusMiles) {
 const radius=Math.max(INITIAL_MAP_RADIUS_MILES,Math.min(MAX_MAP_RADIUS_MILES,radiusMiles));
 const metersPerPixelAtZero=156543.03392*Math.cos(latitude*Math.PI/180);
 return Math.log2(Math.hypot(Math.max(1,width),Math.max(1,height))*metersPerPixelAtZero/(2*radius*METERS_PER_MILE));
}
export function boundsForRadius(center,radiusMiles) {
 const radius=Math.max(INITIAL_MAP_RADIUS_MILES,Math.min(MAX_MAP_RADIUS_MILES,radiusMiles));
 const latitudeDelta=radius/69.09,longitudeDelta=radius/(69.09*Math.cos(center.lat*Math.PI/180));
 return {north:center.lat+latitudeDelta,south:center.lat-latitudeDelta,east:center.lng+longitudeDelta,west:center.lng-longitudeDelta};
}
