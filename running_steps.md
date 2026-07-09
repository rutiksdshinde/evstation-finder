# Running Steps (EVahan)

This file contains the exact steps to run EVahan locally.

## Prerequisites
- Windows with **XAMPP** installed
- **Apache** enabled
- Internet connection (required for TomTom + OpenAI + map tiles)

## Steps
1. Ensure XAMPP is installed.
2. Start **Apache** from the XAMPP control panel.
3. Keep this project folder under your XAMPP web root.
   - Current location:
     - `c:/xampp/htdocs/evahan (deployed)`
4. Open the project in browser.
   - Home page:
     - `http://localhost/evahan%20(deployed)/index.html`
5. Use the pages:
   - **Station Finder:** `ev_search.html`
   - **Route Planner:** `ev_routing.html`
   - **Traffic:** `traffic.html`
   - **Cost Calculator:** `ev_calculator.html`
   - **About:** `about.html`
   - **Contact:** `contact.html`
   - **Careers:** `careers.html`
   - **Privacy:** `privacy.html`
   - **Terms:** `terms.html`

## Testing the core features

### 1) EV Station Finder (ev_search.html)
1. Open `ev_search.html` in browser.
2. Type a location (or select one from suggestions if available).
3. Set distance radius.
4. Click search (button/trigger depending on the UI).
5. Click a station marker to open the popup and view availability (when returned by API).

### 2) EV Route Planner (ev_routing.html)
1. Open `ev_routing.html`.
2. Enter **Start** location (autocomplete supported).
3. Enter **Finish** destination (autocomplete supported).
4. Click **Calculate**.
5. The route and markers will render on the map along with route summary.
6. Traffic overlay is added on the route.

### 3) EV Cost Estimator (ev_calculator.html)
1. Open `ev_calculator.html`.
2. Enter:
   - Trip Distance (km)
   - Vehicle Efficiency (kWh/100km)
   - Electricity Rate (₹/kWh)
3. Click **Calculate Estimate**.
4. View estimated total cost and cost per km.

### 4) Chatbot
1. Open any page.
2. Click the chat floating button (bottom-right).
3. Type your question and send.

## Notes
- Replace API keys in `config.js` for TomTom/OpenAI to work correctly.
- If map does not load, check browser console/network tab for API key errors.

