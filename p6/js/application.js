var meetupURL = 'https://api.meetup.com/2/open_events?zip=08873&and_text=False&offset=0&format=json&limited_events=False&text=CODING+PROGRAMMING+PROGRAM+JAVA+PYTHON+C+NET&photo-host=public&page=200&radius=25.0&desc=False&status=upcoming&sig_id=212929806&sig=908dfb154c1ff9cc1af39a9882b1dc17aa9c2152';
var map;
var infowindow;

/* Capitalizes first letter of each word if sentence is longer than 10 characters */
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

/*A Google Map object*/
var googleMap = function(center, element) {
  var self = this;
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

  return map;
};

//Initial map
function initMap() {
	var element = document.getElementById('map');
	var center = {
		lat: 40.527833, 
		lng: -74.4789521
	};
	if(navigator.geolocation) {
		navigator.geolocation.getCurrentPosition(function(position) {
			center = {
				lat: position.coords.latitude,
				lng: position.coords.longitude
			};
		});
	}
	map = googleMap(center, element);
	fetchData(meetupURL);
	infowindow = new google.maps.InfoWindow({maxWidth : 250});
}

function fetchData(url) {
	var data;
	var self = myViewModel;
	console.log(myViewModel);
	console.log(self);
	var res = $.ajax({
		url: url,
		type: 'GET',
		timeout: 5000,
		dataType: 'jsonp',
		cache: false
	});
	res.success(function(response) {
		data = response.results;
		data.forEach(function(meetup) {
			var newMeet = new Meetup(meetup, map);
			self.meetups.push(newMeet);
			self.addMeetup(newMeet);
		});
	self.positions().forEach(function(position) {
		google.maps.event.addListener(position.marker, 'click', function() {
			self.selectPos(position);
			});
		});
	});

		res.error(function(response, status, error) {
    textStatus = "Meetup data could not be found. Please refresh the page or try again later."   
    alert(
        "API Status : " + response.status + '\n' + "Error Message : " + textStatus);           
    });
}

//Create ViewModel
var ViewModel = function() {
	var self = this;
	self.meetups = ko.observableArray([]);
	self.positions = ko.observableArray([]);
	self.inputStr = ko.observable('');
	self.numCorners = ko.observable(0);
	self.search = function() {

	};
	self.positionsShowed = ko.computed(function() {
		self.positions().forEach(function(pos) {
			pos.marker.setMap(null);
		});
		var result;
		var filter = function(position) {
			return position.name.toLowerCase().indexOf(self.inputStr().toLowerCase()) !== -1;
		};
		result = ko.utils.arrayFilter(self.positions(), filter);
		result.forEach(function(pos){
			pos.marker.setMap(map);
		});
		self.numCorners(result.length);
		return result;
	});

	self.addMeetup = function(meetup) {
		if(meetup.hasVenue && meetup.venue.lat && meetup.venue.lon) {
			var pos;
			self.positions().forEach(function(position) {
				if(position.id === meetup.venue.id) {
					pos = position;
					return;
				}
			});
			if(pos == null) {
				pos = new Position(meetup.venue, map);
				self.positions.push(pos);
			}
			pos.add(meetup);
		}
	}

	self.selectPos = function (position) {
		if(position.marker.getAnimation() !== null) {
			position.marker.setAnimation(null);
		} else {
			position.marker.setAnimation(google.maps.Animation.BOUNCE);
		}
		map.panTo(position.location);
		infowindow.setContent(position.string());
		infowindow.open(map, position.marker);
		self.positions().forEach(function(temp) {
			if(temp != position) {
				temp.marker.setAnimation(null);
			}
		});
	};
	//google.maps.event.addDomListener(window, 'load', initMap());


};

var myViewModel = new ViewModel();
//create Meetup class
var Meetup = function(meetup, map) {
	var self = this;
	self.venue = meetup.venue;
	self.hasVenue = self.venue ? true : false;
	self.id = meetup.id;
	self.name = meetup.name.titleize();
	self.url = meetup.event_url;
	self.time = new Date(meetup.time).toLocaleDateString();
	self.count = meetup.headcount;
	self.headcount = meetup.headcount;
	self.groupName = meetup.group ? meetup.group.name : 'undefined';
};
ko.applyBindings(myViewModel);

//create Position class
var Position = function(venue, map) {
	var self = this;
	self.id = venue.id;
	self.lon = venue.lon;
	self.lat = venue.lat;
	self.location = new google.maps.LatLng(self.lat, self.lon);
	self.address = venue.address_1;
	self.meetups = ko.observableArray([]);
	self.name = venue.name.titleize();
	self.length = ko.computed(function() {
		return self.meetups().length;
	});
	self.add = function(meetup) {
		self.meetups.push(meetup);
	};
	self.string = ko.computed(function() {
		var result = '<ul class="info-window-list">';
		self.meetups().forEach(function(meetup) {
			result += '<li class="info-li">' + '<a href="' + meetup.url + '">' + meetup.name  +
			'</a>' + ' on ' + meetup.time + ' by ' + meetup.groupName +'</li>';
		});
		result += '</ul>';
		result = '<div class="info-window">' + '<span class="info-header">' +
		self.name + '</span>' + '<p class="info-loc">' + self.address + '</p>' + result +
		'</div>';
		return result;
	});
	self.marker = new google.maps.Marker({
		position: self.location,
		map: map,
		animation: google.maps.Animation.DROP
	});
};