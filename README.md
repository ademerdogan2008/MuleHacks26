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

- Connect: four-column player grid, incremental loading, game and name search, online status, region, and playstyle filters.
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

The Map button beside Play opens a responsive event map and list. It requests browser location permission, falls back to the Chicago demo area when unavailable, and supports event selection, search, ongoing/upcoming filters, and locally persisted demo RSVPs (including cancellation).

Copy `.env.example` to `.env.local`, set `VITE_GOOGLE_MAPS_API_KEY`, and restart Vite. Enable the **Maps JavaScript API** and billing for the key's Google Cloud project. Restrict the browser key to your website domains and that API. Optionally set `VITE_GOOGLE_MAPS_MAP_ID` to your production map ID; development uses `DEMO_MAP_ID`. The map uses Google's advanced markers and dark color scheme. Without a key, a labeled illustrative map keeps the event demo usable. Browser geolocation requires HTTPS or localhost.

Events are sample data in `src/Events.jsx`, with illustrative venues placed near the map center and dates relative to opening the view. Google Maps renders the map; it does not supply events. For production, replace these templates with organizer-provided events with fixed coordinates and dates, and connect RSVPs to an authenticated backend with capacity enforcement. Current sign-ups only save on the current device and do not book attendance.

## Profile location and nearby Connect

Set **City, State** in Edit Profile by searching for a US city and selecting a suggestion (for example, `Warrensburg, MO`). Connect requires a valid location and always limits discovery to **50 miles**, including the boundary, measured as straight-line distance between city centers. The radius combines with game, name, online, region, and playstyle filters; Reset does not remove it. City labels appear on Connect cards, profile headers, and your sidebar player card.

City search uses [Open-Meteo geocoding](https://open-meteo.com/en/docs/geocoding-api), with location data from [GeoNames](https://www.geonames.org/). The lookup requires internet access; lookup failures do not change your saved profile. Saved coordinates allow filtering without another lookup. The free API suits this noncommercial demo; commercial use requires the provider’s commercial service.

Profiles and their city coordinates are saved only in this browser’s local storage. Existing profiles keep their fields but must select a location before discovering players. New profiles start without a location. Demo players have fixed city coordinates around Warrensburg and in distant cities. The radius applies to Connect; party selection and the Events map use their existing behavior. Production requires authenticated shared profiles and server-side distance filtering.

Run `npm test` for location validation, distance-boundary, lookup normalization, and profile migration checks.

Event cards also show **Who’s going**: a read-only dialog of registered connections with their existing profile pictures. The button badge shows the full connection count; beside the attendance total, up to four green-bordered avatars overlap in order, followed by the number of additional connections. Both views derive from the same intersection of connections and registration IDs. Until a connections backend is added, the first eight demo players act as connections and each event has sample registration IDs in `src/Events.jsx`.
