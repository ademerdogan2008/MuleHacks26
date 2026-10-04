import {defineConfig,loadEnv} from 'vite';
import {createEventsHandler} from './server/events.js';
export default defineConfig(({mode})=>{
 const env={...loadEnv(mode,process.cwd(),''),...process.env};
 return {plugins:[{name:'local-events-api',configureServer(server){server.middlewares.use(createEventsHandler(env));},configurePreviewServer(server){server.middlewares.use(createEventsHandler(env));}}]};
});
