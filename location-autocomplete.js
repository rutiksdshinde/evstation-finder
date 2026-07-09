// location-autocomplete.js - Simple autocomplete for location inputs

console.log('location-autocomplete.js loaded');

function LocationAutocomplete(inputId) {
  this.input = document.getElementById(inputId);
  if (!this.input) return;

  this.dropdown = null;
  this.suggestions = [];
  this.init();
}

LocationAutocomplete.prototype.init = function() {
  this.createDropdown();
  this.input.addEventListener('input', this.handleInput.bind(this));
  this.input.addEventListener('blur', this.handleBlur.bind(this));
};

LocationAutocomplete.prototype.createDropdown = function() {
  this.dropdown = document.createElement('div');
  this.dropdown.style.cssText = 'position:fixed; background:white; border:1px solid #ccc; z-index:10000; display:none; max-height:200px; overflow-y:auto; box-shadow:0 4px 8px rgba(0,0,0,0.1); border-radius:4px;';
  document.body.appendChild(this.dropdown);
};

LocationAutocomplete.prototype.handleInput = function(e) {
  var query = e.target.value.trim();
  if (query.length < 2) {
    this.hideDropdown();
    return;
  }

  var self = this;
  // Mock data for demonstration - replace with real API call when available
  var mockSuggestions = [
    { address: { freeformAddress: query + ', Bangalore, Karnataka, India' } },
    { address: { freeformAddress: query + ' Road, Mumbai, Maharashtra, India' } },
    { address: { freeformAddress: query + ' Nagar, Delhi, India' } },
    { address: { freeformAddress: query + ' Colony, Chennai, Tamil Nadu, India' } },
    { address: { freeformAddress: query + ' Street, Kolkata, West Bengal, India' } }
  ];

  // Simulate API delay
  setTimeout(function() {
    self.suggestions = mockSuggestions;
    self.renderSuggestions();
  }, 300);
};

LocationAutocomplete.prototype.renderSuggestions = function() {
  this.dropdown.innerHTML = '';
  if (this.suggestions.length === 0) return;

  var list = document.createElement('ul');
  list.style.cssText = 'list-style:none; margin:0; padding:0;';

  for (var i = 0; i < this.suggestions.length; i++) {
    var result = this.suggestions[i];
    var item = document.createElement('li');
    item.style.cssText = 'padding:8px; cursor:pointer; border-bottom:1px solid #eee;';
    item.textContent = result.address.freeformAddress;
    item.addEventListener('click', this.selectSuggestion.bind(this, result));
    list.appendChild(item);
  }

  this.dropdown.appendChild(list);
  this.showDropdown();
};

LocationAutocomplete.prototype.selectSuggestion = function(result) {
  this.input.value = result.address.freeformAddress;
  this.hideDropdown();
};

LocationAutocomplete.prototype.showDropdown = function() {
  var rect = this.input.getBoundingClientRect();
  this.dropdown.style.top = rect.bottom + 'px';
  this.dropdown.style.left = rect.left + 'px';
  this.dropdown.style.width = rect.width + 'px';
  this.dropdown.style.display = 'block';
};

LocationAutocomplete.prototype.hideDropdown = function() {
  this.dropdown.style.display = 'none';
};

LocationAutocomplete.prototype.handleBlur = function() {
  setTimeout(this.hideDropdown.bind(this), 150);
};

function initLocationAutocomplete(inputIds) {
  if (Array.isArray(inputIds)) {
    inputIds.forEach(function(id) {
      new LocationAutocomplete(id);
    });
  } else {
    new LocationAutocomplete(inputIds);
  }
}
