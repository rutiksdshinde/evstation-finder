const application = {
    key: 'btVdXlLhF1rgfMqkkAZv8aWClICR4ruk', 
    name: 'EV Routing',
    version: '1.0'
};

const appearance = {
    marker: {
        color: { start: 'green', finish: 'red', leg: 'blue', user: '#0099ff' }
    },
    line: {
        color: '#224488', width: 6, padding: 40, join: 'round', cap: 'round'
    }
};

const ids = {
    html: { map: 'map', start: 'start', finish: 'finish', summary: 'summary' },
    route: { source: 'routeSource', layer: 'routeLayer' }
};

const labels = {
    lengthInMeters: 'Travel Distance (km)',
    travelTimeInSeconds: 'Travel Time',
    trafficDelayInSeconds: 'Traffic Delay',
    batteryConsumptionInkWh: 'Battery Consumption (kWh)',
    remainingChargeAtArrivalInkWh: 'Remaining Charge (kWh)',
    totalChargingTimeInSeconds: 'Total Charging Time',
    targetChargeInkWh: 'Target Charge (kWh)',
    chargingTimeInSeconds: 'Charging Time',
    routeSummary: 'Route Summary',
    legSummary: 'Route Leg #%s'
};

const units = {
    metersPerKilometer: 1000,
    secondsPerMinute: 60,
    secondsPerHour: 3600
};

const markers = [];
var finishLocation;
var routeData;
var startLocation = null;
var useGPS = false;
var userMarker = null; // To show the user's location immediately

function enableAutocomplete(inputId, suggestionBoxId) {
    const input = document.getElementById(inputId);
    const box = document.getElementById(suggestionBoxId);

    let debounceTimer;

    input.addEventListener("input", function () {
        const query = input.value.trim();
        clearTimeout(debounceTimer);

        if (query.length < 3) {
            box.style.display = "none";
            return;
        }

        debounceTimer = setTimeout(() => {
            tt.services.fuzzySearch({
                key: application.key,
                query: query,
                limit: 5
            })
            .go()
            .then(res => {
                box.innerHTML = "";
                box.style.display = "block";

                res.results.forEach(place => {
                    const div = document.createElement("div");
                    div.className = "suggestion-item";
                    div.innerText = place.address.freeformAddress;

                    div.onclick = () => {
                        input.value = place.address.freeformAddress;
                        input.dataset.lat = place.position.lat;
                        input.dataset.lng = place.position.lng;
                        box.style.display = "none";
                    };

                    box.appendChild(div);
                });
            });
        }, 300);
    });

    document.addEventListener("click", e => {
        if (!box.contains(e.target) && e.target !== input) {
            box.style.display = "none";
        }
    });
}

init();

// --- FIXED GPS FUNCTION ---
function useCurrentLocation() {
    if (!navigator.geolocation) {
        displayMessage('Geolocation is not supported by your browser.');
        return;
    }

    displayMessage('Acquiring precise location (this may take a moment)...');

    // Options to force high accuracy
    const options = {
        enableHighAccuracy: true, // CRITICAL: Forces GPS/Wi-Fi over IP
        timeout: 10000,           // Wait up to 10s for a fix
        maximumAge: 0             // Do not use cached old positions
    };

    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lng = position.coords.longitude;
            
            // Set global startLocation
            startLocation = {
                position: { lat: lat, lng: lng }, 
                address: { freeformAddress: "Current Location" }
            };

            // Update UI
            document.getElementById(ids.html.start).value = "Current Location";
            useGPS = true;
            
            displayMessage('Precise location found! Enter destination and click Calculate.');
            
            // Visual Confirmation: Fly to location
            if(map) {
                map.flyTo({ center: [lng, lat], zoom: 14 });
                
                // Add a temporary marker to show where we found you
                if(userMarker) userMarker.remove();
                userMarker = new tt.Marker({ color: appearance.marker.color.user })
                    .setLngLat([lng, lat])
                    .setPopup(new tt.Popup({ offset: 30 }).setText("You are here"))
                    .addTo(map);
                userMarker.togglePopup();
            }
        },
        function(error) {
            let msg = "Unable to retrieve location.";
            switch(error.code) {
                case error.PERMISSION_DENIED: msg = "Location permission denied. Please allow location access in your browser settings."; break;
                case error.POSITION_UNAVAILABLE: msg = "Location information is unavailable."; break;
                case error.TIMEOUT: msg = "The request to get your location timed out."; break;
            }
            displayMessage(msg);
        },
        options 
    );
}

// --- MAIN CALCULATION ENTRY POINT ---
function startRouteCalculation() {
    if (!map.loaded()) {
        displayMessage('Please wait, map is still loading.');
        return;
    }

    // Clear previous route but keep user marker if it exists
    clearRoute();

    const startInput = document.getElementById(ids.html.start);
    const finishInput = document.getElementById(ids.html.finish);
    const startVal = getValue(ids.html.start);
    const finishVal = getValue(ids.html.finish);

    if (!startVal || !finishVal) {
        displayMessage('Please enter both start and finish locations.');
        return;
    }

    const startLat = startInput.dataset.lat;
    const startLng = startInput.dataset.lng;
    const endLat = finishInput.dataset.lat;
    const endLng = finishInput.dataset.lng;

    if (!startLat || !startLng) {
        displayMessage('Please select a start location from suggestions.');
        return;
    }

    if (!endLat || !endLng) {
        displayMessage('Please select a destination from suggestions.');
        return;
    }

    // Use GPS location if flag is set, otherwise use coordinates
    if (useGPS && startVal === "Current Location" && startLocation !== null) {
        // startLocation is already set
    } else {
        startLocation = {
            position: { lat: parseFloat(startLat), lng: parseFloat(startLng) },
            address: { freeformAddress: startVal }
        };
    }

    finishLocation = {
        position: { lat: parseFloat(endLat), lng: parseFloat(endLng) },
        address: { freeformAddress: finishVal }
    };

    // Remove user marker
    if(userMarker) { userMarker.remove(); userMarker = null; }

    displayMessage('Calculating route...');

    console.log('Start Location:', startLocation.position);
    console.log('Finish Location:', finishLocation.position);

    calculateLongDistanceEVRoute({
        key: application.key,
        locations: [startLocation.position, finishLocation.position],
        avoid: 'unpavedRoads',
        vehicleEngineType: 'electric',
        vehicleWeight: consumptionModel.vehicleWeight,
        accelerationEfficiency: consumptionModel.accelerationEfficiency,
        decelerationEfficiency: consumptionModel.decelerationEfficiency,
        uphillEfficiency: consumptionModel.uphillEfficiency,
        downhillEfficiency: consumptionModel.downhillEfficiency,
        constantSpeedConsumptionInkWhPerHundredkm: consumptionModel.constantSpeedConsumptionInkWhPerHundredkm,
        currentChargeInkWh: consumptionModel.currentChargeInkWh,
        maxChargeInkWh: consumptionModel.maxChargeInkWh,
        auxiliaryPowerInkW: consumptionModel.auxiliaryPowerInkW,
        minChargeAtDestinationInkWh: minChargeAtDestinationInkWh,
        minChargeAtChargingStopsInkWh: minChargeAtDestinationInkWh,
        chargingModes: chargingModes
    })
    .go()
    .then(displayRoute)
    .catch(function(error) {
        let msg = error.message || error;
        displayMessage('Error calculating route: ' + msg);
    });
}

function findFinish(startResults) {
    startLocation = getLocation(startResults, ids.html.start);
    if (startLocation != null) {
        const finishInput = document.getElementById(ids.html.finish);
        const finishVal = getValue(ids.html.finish);
        if (finishInput.dataset.lat) {
            finishLocation = {
                position: { lat: parseFloat(finishInput.dataset.lat), lng: parseFloat(finishInput.dataset.lng) },
                address: { freeformAddress: finishVal }
            };
            calculateRoute(null);
        } else {
            findLocation(ids.html.finish, calculateRoute);
        }
    }
}

function calculateRoute(finishResults) {
    finishLocation = getLocation(finishResults, ids.html.finish);
    if (finishLocation == null) return;

    displayMessage('Calculating route...');

    // Remove temporary user marker as it will be replaced by the route "Start" marker
    if(userMarker) { userMarker.remove(); userMarker = null; }

    calculateLongDistanceEVRoute({
            key: application.key,
            locations: [startLocation.position, finishLocation.position],
            avoid: 'unpavedRoads',
            vehicleEngineType: 'electric',
            vehicleWeight: consumptionModel.vehicleWeight,
            accelerationEfficiency: consumptionModel.accelerationEfficiency,
            decelerationEfficiency: consumptionModel.decelerationEfficiency,
            uphillEfficiency: consumptionModel.uphillEfficiency,
            downhillEfficiency: consumptionModel.downhillEfficiency,
            constantSpeedConsumptionInkWhPerHundredkm: consumptionModel.constantSpeedConsumptionInkWhPerHundredkm,
            currentChargeInkWh: consumptionModel.currentChargeInkWh,
            maxChargeInkWh: consumptionModel.maxChargeInkWh,
            auxiliaryPowerInkW: consumptionModel.auxiliaryPowerInkW,
            minChargeAtDestinationInkWh: minChargeAtDestinationInkWh,
            minChargeAtChargingStopsInkWh: minChargeAtDestinationInkWh,
            chargingModes: chargingModes
        })
        .go()
        .then(displayRoute)
        .catch(function(error) {
            let msg = error.message || error;
            displayMessage('Error calculating route: ' + msg);
        });
}

function findLocation(elementId, callbackFunction) {
    displayMessage('Finding ' + elementId + ' location...');
    const queryText = getValue(elementId);

    tt.services.fuzzySearch({ key: application.key, query: queryText })
        .go()
        .then(callbackFunction)
        .catch(function(error) {
            displayMessage('Could not find ' + elementId + '. ' + error.message);
        });
}

function getLocation(results, elementId) {
    if (results && results.results && results.results.length > 0) 
        return results.results[0];
    
    displayMessage('Could not find location for: ' + getValue(elementId));
    return null;
}

function displayRoute(results) {
    if (!results || !results.routes || results.routes.length === 0) {
        displayMessage('No suitable route was found.');
        return;
    }
    routeData = results;
    displayMessage('Formatting data for map...');

    const geoJson = routeData.toGeoJson();
    const route = routeData.routes[0];
    
    addRoute(geoJson);
    addRouteMarkers(route);
    fitMapToRoute(geoJson);
    addRouteSummary(route);
}

function addRouteSummary(route) {
    const summary = clearRouteSummary();
    appendSummary(summary, route.summary, labels.routeSummary);
    addRouteLegs(route, appendLegSummary, summary);

    // --- BUTTON CREATION ---
    const startBtn = document.createElement('button');
    startBtn.innerHTML = 'Start Trip <span style="margin-left:5px;">➤</span>';
    startBtn.style.marginTop = '20px';
    startBtn.style.padding = '12px 24px';
    startBtn.style.backgroundColor = '#4CAF50';
    startBtn.style.color = 'white';
    startBtn.style.border = 'none';
    startBtn.style.borderRadius = '8px';
    startBtn.style.cursor = 'pointer';
    startBtn.style.fontSize = '16px';
    startBtn.style.fontWeight = 'bold';
    startBtn.style.width = '100%';
    
    startBtn.onclick = function() {
        function getCoords(pos) {
            let lat, lng;
            if (Array.isArray(pos)) { lng = pos[0]; lat = pos[1]; } 
            else { 
                lat = pos.lat || pos.latitude; 
                lng = pos.lng || pos.lon || pos.longitude; 
            }
            return lat + ',' + lng;
        }

        const startStr = getCoords(startLocation.position);
        const destStr = getCoords(finishLocation.position);
        let googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${startStr}&destination=${destStr}&travelmode=driving`;

        if (route.legs && route.legs.length > 1) {
            const waypoints = [];
            for (let i = 0; i < route.legs.length - 1; i++) {
                const points = route.legs[i].points;
                const stop = points[points.length - 1];
                waypoints.push(getCoords(stop));
            }
            if (waypoints.length > 0) googleMapsUrl += `&waypoints=${waypoints.join('|')}`;
        }
        window.open(googleMapsUrl, '_blank');
    };
    summary.appendChild(startBtn);
}

// --- BOILERPLATE HELPERS ---

function addLegMarker(leg, index, lastIndex) {
    if (index == lastIndex) return;
    const points = leg.points;
    const lastPointIndex = points.length - 1;
    if (lastPointIndex < 0) return;
    addMarker(points[lastPointIndex], appearance.marker.color.leg);
}

function addMarker(position, color) {
    markers.push(new tt.Marker({ color: color }).setLngLat(position).addTo(map));
}

function addRoute(geoJson) {
    map.addSource(ids.route.source, { type: 'geojson', data: geoJson });
    map.addLayer({
        id: ids.route.layer,
        type: 'line',
        source: ids.route.source,
        layout: { 'line-join': appearance.line.join, 'line-cap': appearance.line.cap },
        paint: { 'line-color': appearance.line.color, 'line-width': appearance.line.width }
    });
    
    // Add traffic layer to display real-time traffic on the route
    addTrafficLayer();
}

function addTrafficLayer() {
    // Add traffic flow layer using TomTom traffic tiles
    if (!map.getLayer('trafficFlow')) {
        map.addLayer({
            id: 'trafficFlow',
            type: 'line',
            source: {
                type: 'vector',
                source: 'trafficSource',
                url: 'https://api.tomtom.com/traffic/map/4/tile/flow/relative0/{z}/{x}/{y}.png'
            },
            'source-layer': 'Traffic flow',
            layout: {
                'line-join': 'round',
                'line-cap': 'round'
            },
            paint: {
                'line-color': [
                    'interpolate',
                    ['linear'],
                    ['get', 'trafficLevel'],
                    0, '#10b981',
                    3, '#f59e0b',
                    5, '#ef4444'
                ],
                'line-width': 3,
                'line-opacity': 0.7
            }
        });
    }
}

function addRouteLegs(route, callbackFunction, argument) {
    if (!route.hasOwnProperty('legs')) return;
    const legs = route.legs;
    if (legs.length < 2) return;
    legs.forEach(function(leg, index) {
        callbackFunction(leg, index, legs.length - 1, argument);
    });
}

function addRouteMarkers(route) {
    addRouteLegs(route, addLegMarker);
    addMarker(startLocation.position, appearance.marker.color.start);
    addMarker(finishLocation.position, appearance.marker.color.finish);
}

function appendHeading(element, label, headingStyle) {
    const heading = document.createElement(headingStyle || 'h3');
    heading.textContent = label;
    element.appendChild(heading);
}

function appendLabelValue(element, label, value) {
    const span = document.createElement('span');
    span.textContent = label + ': ' + value;
    appendLineBreak(element);
    element.appendChild(span);
}

function appendLegSummary(leg, index, lastIndex, summary) {
    appendSummary(summary, leg.summary, labels.legSummary.replace('%s', index + 1));
}

function appendLineBreak(element, child) {
    const lastChild = element.lastChild;
    const lastTagName = lastChild == null ? null : lastChild.tagName;
    if (lastTagName != null && lastTagName.charAt(0) != 'H')
        element.appendChild(document.createElement('br'));
}

function appendProperty(element, options, label, name, format) {
    if (options.hasOwnProperty(name))
        appendLabelValue(element, label, format == null ? options[name] : format(options[name]));
}

function appendSummary(summary, properties, heading) {
    appendHeading(summary, heading);
    appendProperty(summary, properties, labels.lengthInMeters, 'lengthInMeters', formatMetersToKilometers);
    appendProperty(summary, properties, labels.travelTimeInSeconds, 'travelTimeInSeconds', formatSecondsToTime);
    appendProperty(summary, properties, labels.trafficDelayInSeconds, 'trafficDelayInSeconds', formatSecondsToTime);
    appendProperty(summary, properties, labels.batteryConsumptionInkWh, 'batteryConsumptionInkWh', formatFixedDecimal);
    appendProperty(summary, properties, labels.remainingChargeAtArrivalInkWh, 'remainingChargeAtArrivalInkWh', formatFixedDecimal);
    appendProperty(summary, properties, labels.totalChargingTimeInSeconds, 'totalChargingTimeInSeconds', formatSecondsToTime);

    if (!properties.hasOwnProperty('chargingInformationAtEndOfLeg')) return;
    properties = properties.chargingInformationAtEndOfLeg;
    appendProperty(summary, properties, labels.targetChargeInkWh, 'targetChargeInkWh', formatFixedDecimal);
    appendProperty(summary, properties, labels.chargingTimeInSeconds, 'chargingTimeInSeconds', formatSecondsToTime);
}

function clearRoute() {
    clearRouteSummary();
    while (markers.length > 0) markers.pop().remove();
    if (routeData != null) {
        if(map.getLayer(ids.route.layer)) map.removeLayer(ids.route.layer);
        if(map.getSource(ids.route.source)) map.removeSource(ids.route.source);
    }
    routeData = null;
}

function clearRouteSummary() {
    const summary = document.getElementById(ids.html.summary);
    while (summary.firstChild) summary.removeChild(summary.firstChild);
    return summary;
}

function displayMessage(message) {
    const summary = document.getElementById(ids.html.summary);
    summary.textContent = message;
}

function fitMapToRoute(geoJson) {
    const bounds = getBounds(geoJson);
    map.fitBounds(bounds, { padding: appearance.line.padding });
}

function formatMetersToKilometers(meters) {
    return (meters / units.metersPerKilometer).toFixed(3);
}

function formatSecondsToTime(seconds) {
    const hours = Math.floor(seconds / units.secondsPerHour);
    seconds -= hours * units.secondsPerHour;
    const minutes = Math.floor(seconds / units.secondsPerMinute);
    seconds -= minutes * units.secondsPerMinute;
    return hours + ':' + ((minutes < 10) ? '0' + minutes : minutes) + ':' + ((seconds < 10) ? '0' + seconds : seconds);
}

function formatFixedDecimal(value) { return value.toFixed(4); }

function getBounds(geoJson) {
    const bounds = new tt.LngLatBounds();
    bounds.extend(startLocation.position);
    bounds.extend(finishLocation.position);
    geoJson.features.forEach(function(feature) {
        feature.geometry.coordinates.forEach(function(coordinate) {
            bounds.extend(coordinate);
        });
    });
    return bounds;
}

function getValue(elementId) {
    const el = document.getElementById(elementId);
    return el ? el.value : '';
}

function init() {
    tt.setProductInfo(application.name, application.version);
    map = tt.map({
        key: application.key,
        container: ids.html.map,
        center: [73.8567, 18.5204], // Pune coordinates
        zoom: 10
    });

    enableAutocomplete("start", "start-suggestions");
    enableAutocomplete("finish", "finish-suggestions");
    
    // Reset GPS if user types manually
    document.getElementById(ids.html.start).addEventListener('input', function() {
        useGPS = false;
        startLocation = null;
        if(userMarker) { userMarker.remove(); userMarker = null; }
    });
}
