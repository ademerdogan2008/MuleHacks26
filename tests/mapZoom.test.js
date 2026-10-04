import test from 'node:test';
import assert from 'node:assert/strict';
import {zoomForRadius,boundsForRadius,INITIAL_MAP_RADIUS_MILES,MAX_MAP_RADIUS_MILES,clampPreviewView,zoomPreviewView} from '../src/mapZoom.js';

test('zoom out adds at most 50 miles across desktop and mobile viewports',()=>{
 for(const [width,height] of [[900,580],[360,580],[1600,400]]) {
  const zoom=zoomForRadius(width,height,39.0997,1000);
  const metersPerPixel=156543.03392*Math.cos(39.0997*Math.PI/180)/2**zoom;
  const visibleRadius=Math.hypot(width,height)*metersPerPixel/2/1609.344;
  assert.ok(Math.abs(visibleRadius-75)<1e-8);
  assert.equal(MAX_MAP_RADIUS_MILES-INITIAL_MAP_RADIUS_MILES,50);
  assert.ok(zoomForRadius(width,height,39.0997,25)>zoom);
 }
});

test('panning bounds cannot grow beyond the maximum map radius',()=>{
 const center={lat:39.0997,lng:-94.5786};
 assert.deepEqual(boundsForRadius(center,1000),boundsForRadius(center,75));
 const initial=boundsForRadius(center,25),expanded=boundsForRadius(center,75);
 assert.ok(initial.north<expanded.north&&initial.south>expanded.south);
 assert.ok(initial.east<expanded.east&&initial.west>expanded.west);
});


test('repeated wheel gestures stop at the limit and zoom back in',()=>{
 let view={scale:1,x:100,y:70};
 for(let i=0;i<40;i++)view=zoomPreviewView(view,150,50,40,900,580);
 assert.deepEqual(view,{scale:1/3,x:0,y:0});
 const closer=zoomPreviewView(view,-150,0,0,900,580);
 assert.ok(closer.scale>view.scale);
 assert.deepEqual(clampPreviewView({...closer,x:1e6,y:-1e6},900,580),{scale:closer.scale,x:900*(1.5*closer.scale-.5),y:-580*(1.5*closer.scale-.5)});
});

test('wheel zoom keeps the point under the cursor stationary',()=>{
 const original={scale:1,x:0,y:0},x=70,y=40;
 const next=zoomPreviewView(original,-100,x,y,900,580);
 assert.ok(Math.abs((x-next.x)/next.scale-x)<1e-9);
 assert.ok(Math.abs((y-next.y)/next.scale-y)<1e-9);
});
