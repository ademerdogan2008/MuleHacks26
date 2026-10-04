import {cityBoundary} from './kansasCityBoundary.js';
import {KANSAS_CITY_BOUNDS} from '../src/eventData.js';

export function isInKansasCity(position) {
 if(!position||!Number.isFinite(position.lat)||!Number.isFinite(position.lng))return false;
 const {lat:y,lng:x}=position,b=KANSAS_CITY_BOUNDS;
 if(y<b.south||y>b.north||x<b.west||x>b.east)return false;
 let inside=false;
 // Even/odd ring crossings retain holes for separate municipalities such as Gladstone.
 for(const ring of cityBoundary)for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const [xi,yi]=ring[i],[xj,yj]=ring[j];
  if(((yi>y)!==(yj>y))&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
 }
 return inside;
}
