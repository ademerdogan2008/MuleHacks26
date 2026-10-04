# Sidequest

A gaming connection app built with React and Vite.

## Run locally

```sh
npm install
npm run dev
```

Open http://localhost:5173. Build for production with `npm run build`.

## Design

E-Pal-inspired gaming discovery styling: charcoal surfaces, purple active states and compact buttons, a cinematic esports banner, colorful game shortcuts, image-led player cards, and persistent bottom app navigation. Shared styles cover discovery, profiles, party setup, and dialogs. Reference-style discovery cards use bordered dark panels, transparent character cutouts, framed avatars, and compatibility metadata. Both public and own profiles share a cover header, profile tabs, searchable game selector, game details, and play-type panels. Rank and role badges are illustrative demo data; party invitations remain simulated.

## Features

- Connect: four-column player grid, incremental loading, game and name search, online status and playstyle filters.
- First-visit game selection and personalized recommendations based on shared interests.
- Full player profiles with bio, region, playstyle, and game interests.
- Play: create and manage a party of up to six players (including the leader), choose teammates with search and selection limits, and arrange players in equal responsive cards. Set the game, region, playstyle, and an optional session note before inviting. Use the compact, wide player grid; selected players turn green and move to the top. Review invite details, simulate individual invite acceptance, copy joined players’ IGN, ready up once everyone joins, and cancel the party.
- Profile: edit name, username, bio, IGN, region, playstyle, games, and upload a profile picture.
- Profile and first-visit preferences persist in browser local storage.

## Demo data and future integration

Player data is currently held in `src/main.jsx`. Invitations are explicitly simulated; no request is sent to another user. Replace the `people` array with paginated database queries, and the party state transitions with authenticated invite and presence events when adding a backend. IGN is currently one field per profile; expand it into a game-to-IGN mapping for per-game accounts. Uploaded profile photos remain local to the browser. No authentication or backend is included.

## Character artwork

Connect uses 24 different transparent PNGs: 12 Valorant agents and 12 League of Legends champions, mixed throughout the grid. Local files live in `public/images/characters`, the card mapping is in `src/characters.js`, and `sources.json` records source pages, download URLs, and file hashes. Valorant artwork comes from Valorant API; League renders come from the League of Legends Wiki. Character artwork belongs to Riot Games.

## Nearby events and Google Maps

The Map button beside Play opens a responsive event map and list. Events are permanently locked to Kansas City, Missouri, independent of your profile city or browser location. Event selection, search, ongoing/upcoming filters, and locally saved plans (including removal) remain available.

Copy `.env.example` to `.env.local`, set `VITE_GOOGLE_MAPS_API_KEY`, and restart Vite. Enable the **Maps JavaScript API** and billing for the key's Google Cloud project. Restrict the browser key to your website domains and that API. Optionally set `VITE_GOOGLE_MAPS_MAP_ID` to your production map ID; development uses `DEMO_MAP_ID`. The map uses Google's advanced markers and dark color scheme. Without a key, a labeled illustrative map keeps the event list usable. The Events page does not request browser location permission.

The map now loads real events by default; no dummy event fallback or API key is needed. [StungEvents](https://docs.stungevents.com/) supplies concerts, festivals, sports, arts, and other ticketed listings. [Mobilize's public organization event API](https://github.com/mobilizeamerica/api#list-organization-events) supplies public, in-person community gatherings, rallies, volunteer events, and meetups. Each card uses the provider's event artwork and links to its registration/details page. Missing or failed images show a labeled fallback instead of an unrelated stock photo.

The server always queries Kansas City, Missouri. Request parameters cannot change the city or center. StungEvents searches “Kansas City”; Mobilize uses postal code 64106 and state MO; optional Ticketmaster queries also specify Kansas City/MO. All results then pass a point-in-polygon check against the [official Kansas City municipal boundary](https://mapd.kcmo.org/kcgis/rest/services/AGOL/MapServer/0), saved in `server/kansasCityBoundary.js` on October 3, 2026. This excludes surrounding municipalities, including Kansas City, Kansas, Overland Park, Independence, Liberty, Gladstone, North Kansas City, and Raytown. Geometry includes enclave holes. The map starts with a 25-mile view radius around Kansas City. Scroll the wheel over the map to zoom in or out, and drag to move the view. Zooming out adds at most 50 miles (75 miles total); Google Maps zoom is capped for the viewport size, and Reset view restores the starting view. The illustrative preview supports the same gestures, plus arrow keys to pan and +/− to zoom. The wider map does not expand event eligibility beyond Kansas City city limits. No location switch is offered. Source coverage is incomplete: only publicly located listings with valid dates can appear, and no events are moved to another city.

`server/events.js` fetches up to two pages of upcoming StungEvents listings, three pages of past starts to check ongoing events, and three pages of Mobilize listings (100 records per page), within a 90-day future window; StungEvents also checks starts within the past seven days for ongoing events. Mobilize uses published timeslot end dates to find ongoing events and shows the next eligible session of a recurring event. The UI initially displays 20 events with “Show more events.” StungEvents city queries are shared and cached for ten minutes to reduce quota use. Combined successful feeds cache for five minutes, and partial failures cache briefly. The client refreshes every five minutes and recomputes status every 30 seconds. Events only show as ongoing if the provider publishes both a start and a future end; cancelled, postponed, ended, virtual, hidden-location, and invalid listings are excluded as appropriate. Provider outages show an error/retry state, or a warning when another source remains available.

Optionally set `TICKETMASTER_API_KEY` in `.env.local` for additional [Ticketmaster Discovery](https://developer.ticketmaster.com/products-and-docs/apis/discovery-api/v2/) coverage. Credentials stay server-side. Never prefix this key with `VITE_`. The default public feeds work without this setting.

Additional organizer events can come from `COMMUNITY_EVENTS_URL`, a server-configured JSON feed returning an array or `{ "events": [...] }`. The request includes `lat`, `lng`, and `radius`. Each item needs `id`, `title`, `start` (ISO timestamp with offset), `position: { lat, lng }`, and an organizer `url`; optional fields are `end` (ISO timestamp with offset), `type`, `venue`, `description` (plain text), `timezone` (IANA), `status`, and `image` (HTTP/HTTPS artwork URL).

The API is installed into Vite development and preview servers by `vite.config.js`. Run `npm run build` followed by `npm run preview` to preview the built app and live feed together. Production static hosting must route `/api/events` to a Node backend using `createEventsHandler` from `server/events.js`; uploading `dist` alone does not include the event API.

Saved plans persist on this device and do not book attendance. “Going here” counts the connections shown and your saved plan, not total attendance at a provider event. Live listings have no fabricated connection registrations; shared registration/presence requires an authenticated backend.

## Profile location and nearby Connect

Connect is populated with all 24 demo players across the Kansas City metro, including nearby Kansas suburbs. Discovery is centered on **Kansas City, MO** and limits results to **50 miles**, including the boundary, measured as straight-line distance between city centers. “All games” shows every nearby player; game, name, online, and playstyle filters narrow the results. Cards are labeled as demo players; there is no shared user database or real availability feed. Metro locations are defined in `src/playerArea.js`.

Set **City, State** in Edit Profile by searching for a US city and selecting a suggestion. Your profile city appears on your own card and profile; it does not change the Kansas City discovery area.

City search uses [Open-Meteo geocoding](https://open-meteo.com/en/docs/geocoding-api), with location data from [GeoNames](https://www.geonames.org/). The lookup requires internet access; lookup failures do not change your saved profile. Saved coordinates allow filtering without another lookup. The free API suits this noncommercial demo; commercial use requires the provider’s commercial service.

Profiles and their city coordinates are saved only in this browser’s local storage. Existing profiles keep their saved fields. New profiles start without a profile location; Kansas City discovery is available immediately. Demo players have fixed city coordinates within 50 miles of Kansas City, MO. The radius applies to Connect; party selection and the Events map use their existing behavior. Production requires authenticated shared profiles and server-side distance filtering.

Run `npm test` for location validation, distance-boundary, lookup normalization, and profile migration checks.

Event cards also show **Who’s going**: a read-only dialog of registered connections with their profile pictures. The badge shows the full connection count; beside the attendance total, up to six 42px green-bordered avatars overlap in order (five on mobile), followed by the number of additional connections. The dialog lists every connection. Both views derive from the same intersection of connections and registration IDs. Only people you have connected with and who have registered appear. Public provider listings start without registration IDs; no sample registrations are added.
