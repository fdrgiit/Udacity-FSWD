// signed url from meetup api, taken from https://secure.meetup.com/meetup_api/console/?path=/2/open_events
var meetupApiUrl = 'https://api.meetup.com/2/open_events?zip=08873&and_text=False&offset=0&format=json&limited_events=False&text=CODING+PROGRAMMING+PROGRAM+JAVA+PYTHON+C+NET&photo-host=public&page=200&radius=25.0&desc=False&status=upcoming&sig_id=212929806&sig=908dfb154c1ff9cc1af39a9882b1dc17aa9c2152';

// capitaling first letter of each word if sentence is longer than 10 characters
String.prototype.titleize = function() {
  var words = this.split(' ');
  var array = [];
  var firstLetter, remainder;
  for (var i=0; i<words.length; ++i) {
    firstLetter = words[i].charAt(0).toUpperCase();
    if (this == this.toUpperCase() && this.length > 10) {
      remainder = words[i].toLowerCase().slice(1);
    } else {
      remainder = words[i].slice(1);
    }
    array.push(firstLetter + remainder);
  }
  return array.join(' ');
};

String.prototype.contains = function(other) {
  return this.indexOf(other) !== -1;
};

//here `venueObject` == sub-item from Meetup API `open_venue` JSON response
var Corner = function(venueObject) {
  var self = this;

  // load and check for latitude/longitude and set to location
  self.lat = venueObject.lat;
  self.lon = venueObject.lon;
  self.location = ko.computed(function() {

    if (self.lat === 0 || self.lon === 0) {
      return null;
    } else {
      return new google.maps.LatLng(self.lat, self.lon);
    }
  });

  //Metadata
  self.id = venueObject.id;
  self.name = ko.observable(venueObject.name.titleize());
  self.address = ko.observable(venueObject.address_1);

  //Initializing meetup
  self.meetups = ko.observableArray([]);

  //Initializing marker
  self.marker = new google.maps.Marker();
};

//here `meetup` == item from Meetup API `open_venue` JSON response
var Meetup = function(meetup) {
  var self = this;

  self.venueObject = meetup.venue;

  //If the meetup has a venue that's listed, return
  self.hasVenue = ko.computed(function() {
    if (self.venueObject) {
      return true;
    } else {
      return false;
    }
  });

  self.id = ko.observable(meetup.id);
  self.name = ko.observable(meetup.name.titleize());
  self.group = ko.observable(meetup.group.name);

  //converting date from milliseconds to mm/dd/yyyy
  self.date = ko.computed(function() {
    var milliseconds = meetup.time;
    var date = new Date(milliseconds);
    return date.toLocaleDateString();
  });
  self.url = ko.observable(meetup.event_url);
};

//View Model
var ViewModel = function() {
  var self = this;

  var map;

  var mapCanvas = $('#map-canvas')[0];

  //Location set to NJ
  var center = new google.maps.LatLng(40.527833, -74.4789521);

  var infoWindow = new google.maps.InfoWindow();

  //List of meetups
  self.meetupList = ko.observableArray([]);

  self.cornerList = ko.observableArray([]);

  // number of meetups
  self.numCorners = ko.observable(0);

  /* SEARCH */

  // search query, bound to `#search-input` search box
  self.query = ko.observable('');

  // bound to `#search-btn`
  self.search = function() {
    // Empty function to avoid page reload
  };

  self.filteredCornerList = ko.computed(function() {
    // loop through corners and clear map markers
    self.cornerList().forEach(function(corner) {
      corner.marker.setMap(null);
    });

    // filtering results where name contains `self.query`
    var results = ko.utils.arrayFilter(self.cornerList(), function(corner) {
      return corner.name().toLowerCase().contains(self.query().toLowerCase());
    });

    //Set marker to visible
    results.forEach(function(corner) {
      corner.marker.setMap(map);
    });

    self.numCorners(results.length);
    return results;
  });

  /* SELECTION */

  // triggered when a corner in `#list` is clicked or a marker is clicked
  self.selectCorner = function(corner) {
    // generate html for a corner's upcoming open meetups
    var formattedMeetupList = (function(corner) {
      result = '<ul class="info-window-list">';
      corner.meetups().forEach(function(meetup) {
        result += '<li>' +
                  '<a href="' +
                  meetup.url() +
                  '">' +
                    meetup.name() +
                  '</a>' +
                  ' on ' +
                  meetup.date() +
                  '</li>';
      });
      result += '</ul>';
      return result;
    })(corner);
    // generate additional html and set to info window content
    infoWindow.setContent('<div class="info-window-content">' +
                          '<span class="info-window-header">' +
                            corner.name() +
                          '</span>' +
                          '<p>' +
                            corner.address() +
                          '</p>' +
                            formattedMeetupList +
                          '</div>'
                         );

    infoWindow.open(map, corner.marker);

    // scrolling the map to the selected marker's position
    map.panTo(corner.marker.position);
  };

  // creates a black and white google map
  function drawMap(center, element) { // http://stackoverflow.com/questions/6588549/make-google-maps-plugin-black-white-or-with-sepia-filter
    var roadAtlasStyles = [
      {
        "featureType": "road.highway",
        "elementType": "geometry",
        "stylers": [
          { "saturation": -100 },
          { "lightness": -8 },
          { "gamma": 1.18 }
        ]
      }, {
        "featureType": "road.arterial",
        "elementType": "geometry",
        "stylers": [
          { "saturation": -100 },
          { "gamma": 1 },
          { "lightness": -24 }
        ]
      }, {
        "featureType": "poi",
        "elementType": "geometry",
        "stylers": [
          { "saturation": -100 }
        ]
      }, {
        "featureType": "administrative",
        "stylers": [
          { "saturation": -100 }
        ]
      }, {
        "featureType": "transit",
        "stylers": [
          { "saturation": -100 }
        ]
      }, {
        "featureType": "water",
        "elementType": "geometry.fill",
        "stylers": [
          { "saturation": -100 }
        ]
      }, {
        "featureType": "road",
        "stylers": [
          { "color": '#D0B2B2' },
        ]
      }, {
        "featureType": "administrative",
        "stylers": [
          { "saturation": -100 }
        ]
      }, {
        "featureType": "landscape",
        "stylers": [
          { "saturation": -100 }
        ]
      }, {
        "featureType": "poi",
        "stylers": [
          { "saturation": -100 }
        ]
      }
    ];

    var mapOptions = {
      zoom: 11,
      center: center,
      mapTypeControlOptions: {
        mapTypeIds: [google.maps.MapTypeId.ROADMAP, 'usroadatlas']
      },

      //controls
      mapTypeControl: false,
      panControl: false,
      streetViewControl: false,
      zoomControl: false
    };

    map = new google.maps.Map(element, mapOptions);

    var styledMapOptions = {};
    var usRoadMapType = new google.maps.StyledMapType(roadAtlasStyles, styledMapOptions);
    map.mapTypes.set('usroadatlas', usRoadMapType);
    map.setMapTypeId('usroadatlas');
  }

  // creating a marker
  function addMarker(corner) {
    var marker;

    // validate that the corner has a location
    if (corner.location()) {
      marker = new google.maps.Marker({
        position: corner.location(),
        map: map,
      });
      //Listener for when it's clicked
      google.maps.event.addListener(marker, 'click', function () {
        self.selectCorner(corner);
      });
    }
    return marker;
  }

  // fetch meetups via JSON-URL from Meetup API
  function fetchMeetups(url) {
    var data;

    //execute JSON request
    $.ajax({
      type: "GET",
      url: url,
      timeout: 5000,
      contentType: "application/json",
      dataType: "jsonp",
      cache: false,

    }).done(function(response) {
      // pull results array from JSON
      data = response.results;

      data.forEach(function(meetup) {
        self.meetupList.push(new Meetup(meetup));
      });

      extractCorners();

    }).fail(function(response, status, error) {
      $('#search-summary').text('Meetup data could not load...');
    });
  }

  // parsing meetupList and extract objects
  function extractCorners() {
    self.meetupList().forEach(function(meetup){
      if (meetup.hasVenue()) {
        var corner;
        var id = meetup.venueObject.id;

        if (hasCornerId(id)) {
          corner = getCornerById(id);
          corner.meetups.push(meetup);
        } else {
          //New corner object
          corner = new Corner(meetup.venueObject);

          if (corner.location()) {
            self.cornerList.push(corner);
            corner.meetups.push(meetup);
            corner.marker = addMarker(corner);
          }
        }
      }
    });
  }

  // checks if a specific id already exists in cornerList
  function hasCornerId(id) {
    var result = false;
    self.cornerList().forEach(function(corner) {
      if (corner.id.toString() === id.toString()) {
        result = true;
      }
    });
    return result;
  }

  // fetches a corner from cornerList by id
  function getCornerById(id) {
    var foundCorner = null;
    if (hasCornerId(id)) {
      self.cornerList().forEach(function(corner) {
        if (corner.id.toString() === id.toString()) {
          foundCorner = corner;
        }
      });
    }
    return foundCorner;
  }

  /* INITIALIZATION */

  function initialize() {
    drawMap(center, mapCanvas);
    fetchMeetups(meetupApiUrl);
  }

  /* LISTENERS */

  google.maps.event.addDomListener(window, 'load', initialize);
};

ko.applyBindings(new ViewModel());