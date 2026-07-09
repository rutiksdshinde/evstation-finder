# EVahan (Electric Vehicle Charging Platform)

EVahan is a front-end web application that helps users **find EV charging stations**, **plan long-distance EV routes with automatic charging stops**, **monitor traffic on the way**, and **estimate charging costs**.

Live portfolio: https://evahancharge.wasmer.app

## Links
- **Portfolio:** https://prismatic-alpaca-376b6f.netlify.app
- **LinkedIn:** https://www.linkedin.com/in/rutik-shinde-09a438237/
- **GitHub:** https://github.com/rutiksdshinde

---

## Features

### 1) Station Finder
- Search for nearby **electric vehicle charging stations**.
- Uses TomTom services for geolocation / autocomplete and station discovery.
- Shows connector/availability information when charging availability data is present.

### 2) EV Route Planner (Long Distance)
- Calculates long-distance EV routes using the EV routing model.
- Supports **automatic charging stop planning**.
- Renders route on a map and shows route summary metrics.
- Adds a traffic visualization overlay on the route.

### 3) Traffic Monitor (Route Layer Overlay)
- Displays a traffic flow visualization layer (TomTom traffic tile source).
- Helps users understand congestion levels along the route.

### 4) EV Cost Estimator
- Estimates charging cost using:
  - Trip distance (km)
  - Vehicle efficiency (kWh/100km)
  - Electricity rate (₹/kWh)

### 5) EV Assistant Chatbot
- Chat UI available across pages.
- Uses the shared `chatbot.js` and `config.js` setup.

### 6) Theme Toggle (Light/Dark)
- Theme preference is stored in `localStorage` and synced across tabs.

---

## Tech Stack

- **HTML/CSS/JavaScript (Vanilla)**
- **TomTom Maps & Services** (maps, autocomplete, fuzzy search, routing, traffic tiles)
- **OpenAI API integration** (configured in `config.js` for the chatbot)

---

## Project Structure (Top-Level)

Main entry page:
- `index.html`

Core pages:
- `ev_search.html` + `ev_search.js` (Station Finder)
- `ev_routing.html` + `ev_routing.js` (Route Planner)
- `ev_calculator.html` (Cost Estimator)
- `about.html`, `contact.html`, `careers.html`, `privacy.html`, `terms.html`, `app_benefits.html`, `traffic.html`

Shared utilities:
- `config.js` (API key/config holder)
- `chatbot.js`, `chatbot.css` (chat assistant)
- `theme-toggle.js` (theme logic for relevant pages)
- `location-autocomplete.js` (autocomplete helpers)

EV routing model:
- `ev_model.js`
- `calculateLongDistanceEVRoute.js`

Styling:
- `styles.css`, `ev_routing.css`, `sign.css`

---

## Running the Project (Local)

1. Copy/keep this folder under your web server root.
   - In this deployment it’s located at: `c:/xampp/htdocs/evahan (deployed)`
2. Start **Apache** in XAMPP.
3. Open the app in your browser:
   - `http://localhost/evahan%20(deployed)/index.html`
   - Or browse directly to any HTML page in the folder.

---

## API Keys / Configuration Notes

- `config.js` contains placeholders for API keys.
- You must replace values with your own keys for:
  - TomTom services
  - OpenAI (for chatbot)

---

## How to Use (Quick)

- **Find Chargers:** open `ev_search.html` → search → view available stations.
- **Plan Route:** open `ev_routing.html` → enter start/end (autocomplete supported) → calculate.
- **Estimate Cost:** open `ev_calculator.html` → fill distance/efficiency/rate → calculate.

---

## Disclaimer

This project is a front-end demo/application. Availability, routing, and traffic depend on external APIs and live data responses.

