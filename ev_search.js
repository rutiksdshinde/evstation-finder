const application = { key: CONFIG.TOMTOM_API_KEY, name: 'EV Search', version: '1.0' };

const ids = {
  html: {
    map: 'map',
    location: 'location',
    distance: 'distance'
  }
};

const properties = [
  { name: 'available', label: 'available' },
  { name: 'occupied', label: 'occupied' },
  { name: 'outOfService', label: 'out of service' },
  { name: 'reserved', label: 'reserved' },
  { name: 'unknown', label: 'unknown' }
];

const metersPerKilometer = 1000;
const markerColor = '#2563eb';
const mapPadding = 40;
const limit = 100;
const markers = [];

let map;
let center;
let radius;

init();

/* ---------------- HELPERS ---------------- */

function appendLine(el, tag, text) {
  const child = document.createElement(tag);
  child.textContent = text;
  el.appendChild(child);
}

function appendConnector(el, connector) {
  const current = connector.availability.current;
  let text = connector.type + ': ';
  let first = true;

  properties.forEach(p => {
    if (current[p.name] > 0) {
      if (!first) text += ', ';
      text += current[p.name] + ' ' + p.label;
      first = false;
    }
  });

  if (first) text += 'no information';
  appendLine(el, 'span', text);
}

/* ---------------- POPUP CONTENT ---------------- */

function formatText(location, response) {
  const div = document.createElement('div');
  div.className = 'station-popup';

  const stationName = location.poi?.name || location.address.freeformAddress;

  /* Header Section */
  const headerDiv = document.createElement('div');
  headerDiv.className = 'station-header';

  const iconDiv = document.createElement('div');
  iconDiv.className = 'station-icon';
  iconDiv.innerHTML = '<i class="fas fa-charging-station"></i>';
  headerDiv.appendChild(iconDiv);

  /* Station Name */
  if (location.poi?.name) {
    const nameDiv = document.createElement('div');
    nameDiv.className = 'station-name-section';
    const h3 = document.createElement('h3');
    h3.className = 'station-name';
    h3.textContent = location.poi.name;
    nameDiv.appendChild(h3);
    headerDiv.appendChild(nameDiv);
  }
  div.appendChild(headerDiv);

  /* Address Section */
  const addressSection = document.createElement('div');
  addressSection.className = 'station-address-section';
  const addressIcon = document.createElement('i');
  addressIcon.className = 'fas fa-map-marker-alt address-icon';
  addressSection.appendChild(addressIcon);

  const addressDiv = document.createElement('div');
  addressDiv.className = 'station-address';
  const a = document.createElement('a');
  a.href = `https://www.google.com/maps/search/?api=1&query=${location.position.lat},${location.position.lng}`;
  a.textContent = location.address.freeformAddress;
  a.target = '_blank';
  addressDiv.appendChild(a);
  addressSection.appendChild(addressDiv);
  div.appendChild(addressSection);

  /* Directions Button */
  const dir = document.createElement('a');
  dir.className = 'directions-btn';
  dir.href = `https://www.google.com/maps/dir/?api=1&destination=${location.position.lat},${location.position.lng}`;
  dir.target = '_blank';
  dir.innerHTML = '<i class="fas fa-route"></i><span>Get Directions</span>';
  div.appendChild(dir);

  /* Status Section */
  const statusSection = document.createElement('div');
  statusSection.className = 'status-section';

  if (!response || !response.connectors) {
    const statusDiv = document.createElement('div');
    statusDiv.className = 'status-info';
    const message = response && response.message ? response.message : 'Status not available';
    statusDiv.innerHTML = `<i class="fas fa-info-circle"></i><span>${message}</span>`;
    statusSection.appendChild(statusDiv);
  } else {
    const connectorHeader = document.createElement('div');
    connectorHeader.className = 'connector-header';
    connectorHeader.innerHTML = '<i class="fas fa-plug"></i><span>Connector Status</span>';
    statusSection.appendChild(connectorHeader);

    const connectorsDiv = document.createElement('div');
    connectorsDiv.className = 'connectors-list';
    response.connectors.forEach(c => appendConnector(connectorsDiv, c));
    statusSection.appendChild(connectorsDiv);
  }

  div.appendChild(statusSection);

  return div.innerHTML;
}

/* ---------------- MAP & MARKERS ---------------- */

function addMarker(location) {
  const popup = new tt.Popup({ offset: 10, className: 'custom-popup' })
    .setHTML(formatText(location, null))
    .on('open', () => updatePopup(popup, location));

  new tt.Marker({ color: markerColor })
    .setLngLat(location.position)
    .setPopup(popup)
    .addTo(map);

  markers.push(popup);
}

function updatePopup(popup, location) {
  // Always render popup with Rate & Review first
  popup.setHTML(formatText(location, null));

  let availabilityId;
  if (location.dataSources && location.dataSources.chargingAvailability && location.dataSources.chargingAvailability.id) {
    availabilityId = location.dataSources.chargingAvailability.id;
  }

  if (!availabilityId) {
    console.warn(
      'No chargingAvailability for:',
      location.poi?.name || location.address.freeformAddress
    );
    // Update the popup to display "Availability info not available"
    popup.setHTML(formatText(location, { connectors: null, message: 'Availability info not available' }));
    return;
  }

  chargingAvailability({
    key: application.key,
    chargingAvailability: availabilityId
  })
    .go()
    .then(response => {
      popup.setHTML(formatText(location, response));
    })
    .catch(err => {
      console.warn('Charging availability failed:', err);
      const currentHTML = popup.getContent();
      const updatedHTML = currentHTML.replace('ℹ️ Status not available', 'Availability info not available');
      popup.setHTML(updatedHTML);
    });
}

function clearMarkers() {
  while (markers.length) markers.pop().remove();
}

/* ---------------- SEARCH ---------------- */

function findLocation() {
  if (!map.loaded()) return alert('Map still loading');

  clearMarkers();
  const input = document.getElementById("location");

  if (!input.dataset.lat || !input.dataset.lng) {
    alert("Please select a location from suggestions");
    return;
  }

  center = {
    lat: parseFloat(input.dataset.lat),
    lng: parseFloat(input.dataset.lng)
  };
  radius = document.getElementById(ids.html.distance).value * metersPerKilometer;

  tt.services.categorySearch({
    key: application.key,
    query: 'electric vehicle station',
    center,
    radius,
    limit
  })
    .then(createMarkers);
}

function findStations(res) {
  if (!res.results.length) return;

  center = res.results[0].position;
  radius = document.getElementById(ids.html.distance).value * metersPerKilometer;

  tt.services.categorySearch({
    key: application.key,
    query: 'electric vehicle station',
    center,
    radius,
    limit
  })
    .go()
    .then(createMarkers);
}

function createMarkers(res) {
  if (!res.results.length) return alert('No stations found');

  const bounds = new tt.LngLatBounds();
  res.results.forEach(loc => {
    addMarker(loc);
    bounds.extend([loc.position.lng, loc.position.lat]);
  });

  map.fitBounds(bounds, { padding: mapPadding });
}

/* ---------------- INIT ---------------- */

function init() {
  tt.setProductInfo(application.name, application.version);
  map = tt.map({
    key: application.key,
    container: ids.html.map,
    center: [73.8567, 18.5204], // Pune coordinates
    zoom: 10
  });

  map.on('load', () => {
    console.log('Map loaded successfully');
  });

  map.on('error', (error) => {
    console.error('Map failed to load:', error);
    alert('Map failed to load. Please check your internet connection or API key.');
  });
}

/* ---------------- MANUAL LOCATION AUTOCOMPLETE ---------------- */

const locationInput = document.getElementById("location");
const suggestionsBox = document.getElementById("location-suggestions");

let debounceTimer = null;

locationInput.addEventListener("input", () => {
  const query = locationInput.value.trim();

  if (query.length < 3) {
    suggestionsBox.style.display = "none";
    return;
  }

  clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    tt.services.fuzzySearch({
      key: application.key,
      query: query,
      limit: 5
    })
    .then(res => {
      if (res.error) {
        console.error('API error:', res.error);
        suggestionsBox.style.display = "none";
        return;
      }
      suggestionsBox.innerHTML = "";
      if (!res.results || !res.results.length) {
        suggestionsBox.style.display = "none";
        return;
      }

      res.results.forEach(place => {
        const div = document.createElement("div");
        div.className = "suggestion-item";
        div.textContent = place.address?.freeformAddress || 'Unknown location';

        div.addEventListener("click", () => {
          locationInput.value = place.address?.freeformAddress || 'Unknown location';
          locationInput.dataset.lat = place.position.lat;
          locationInput.dataset.lng = place.position.lng;
          suggestionsBox.style.display = "none";
        });

        suggestionsBox.appendChild(div);
      });

      suggestionsBox.style.display = "block";
    })
    .catch(err => {
      console.error('Location autocomplete failed:', err);
      suggestionsBox.style.display = "none";
    });
  }, 300);
});


