//Google Maps API Javascript
var map;
var markers = [];
var selectMarker = null;

//Knockout JS Javascript and connection to the Google Maps API
var initialMarkers = [
{
	position: {lat: 41.914000, lng: -87.644555},
	title: 'Not Home'
},
{
	position: {lat: 41.922572, lng: -87.644352},
	title: 'Allende #2'
},
{
	position: {lat: 41.921092, lng: -87.633991},
	title: 'Zoo'
},
{
	position: {lat: 41.921658, lng: -87.652406},
	title: 'State'
},
{
	position: {lat: 41.904206, lng: -87.634281},
	title: 'Happy Camper'
}

];

var ListItem = function(data, identification) {
	this.position = ko.observable(data.position);
	this.title = ko.observable(data.title);
	this.id = identification;
};

//Isnt run until into page is loaded on API callback to initMap()
var ViewModel = function(){
	var self = this;
	this.list = ko.observableArray([]);
	var i = 1;

	var infoWindow = new google.maps.InfoWindow();
	var defaultIcon = makeMarkerIcon('009100');
	var highlightedIcon = makeMarkerIcon('FFFF24');
	var clickedIcon = makeMarkerIcon('FC0006');
	initialMarkers.forEach(function(newMarker){
		self.list.push(new ListItem(newMarker, i++));
		var marker = new google.maps.Marker({
			map: map,
			position: newMarker.position,
			title: newMarker.title,
			animation: google.maps.Animation.DROP,
			icon: defaultIcon,
			id: i
		});
		markers.push(marker);
		marker.addListener('click', function(){
			populateInfoWindow(this, infoWindow);
			if(selectMarker){
				selectMarker.setIcon(defaultIcon);
			}
			selectMarker = this;
			selectMarker.setIcon(clickedIcon);
		});

		//Mouseover and off for markers
		marker.addListener('mouseover', function() {
			this.setIcon(highlightedIcon);
		});
		marker.addListener('mouseout', function() {
			if (selectMarker != this) {
				this.setIcon(defaultIcon);
			}
		});
	});
	

	this.selectMarker = function(selMarker){
		//Markers mapped to the list by ID so subtract 1
		populateInfoWindow(markers[selMarker.id-1], infoWindow);
		markers[selMarker.id-1].setIcon(clickedIcon);
	};

	//Mouseover and off for list items
	this.highlight = function(selMarker){
		markers[selMarker.id-1].setIcon(highlightedIcon);
	};
	this.dehighlight = function(selMarker){
		markers[selMarker.id-1].setIcon(defaultIcon);
	};


  	//Filter the search results
  	self.filterText = ko.observable("");
  	self.filteredItems = ko.computed(function(){
  		var reg;
		//Condition the text to be filtered
		fText = self.filterText().replace(/\|\s*$/gi, '|');
		fText = fText.replace(/\|\s*$/gi, '');
		reg = new RegExp(fText, "gi");

		//Get a list of all th filtered items from theist
		var filtered = ko.utils.arrayFilter(self.list(), function(item){
			if(fText.length){
				//Find the result
				var res = ko.utils.unwrapObservable(item.title).match(reg);
				//Remove the map icon if neccesary
				if(res === null){
					markers[ko.utils.unwrapObservable(item.id)-1].setVisible(false);
				}else{
					markers[ko.utils.unwrapObservable(item.id)-1].setVisible(true);
				}
				return res;
			}
			else{
				//Place the map icon back on the map
				markers[ko.utils.unwrapObservable(item.id)-1].setVisible(true);
				return 1;
			}
		});
		return filtered;
	}, self);

 	//Sidebar hiding and showing
 	if ($(window).width() < 700) {
 		sidebarShow = ko.observable(false);
 	}else{
 		sidebarShow = ko.observable(true);
 	}
 	//Menu button sidebar toggle
	this.menuAlt = function(){
		sidebarShow(!ko.utils.unwrapObservable(sidebarShow));
		google.maps.event.trigger(map, "resize");
	};
	//Set CSS for page container
	pageContainer = ko.pureComputed(function(){
		return ko.utils.unwrapObservable(sidebarShow) === true ? "containerWBar" : "containerFull";
	});
	//Handle the page if it is dynamically resizeds
	$(window).on('resize', function(){
		if ($(window).width() < 700){
			sidebarShow(false);
		}
	});
};



//Run on maps API callback
function initMap(){
	//Initialize the map
	map = new google.maps.Map(document.getElementById('map'), {
		center: {lat: 41.921438, lng: -87.651304},
		zoom: 14
	});
	//Apply bindings now after the intiMap has been run on API callback
	ko.applyBindings(new ViewModel());
}

//Make the info window
function populateInfoWindow(marker, infowindow) {
	if (infowindow.marker != marker){
		var client_secret = "05KGY0XGXG2JY1UVH5BT5N4Y52N2BXOHNGQJQZJYVCSG2EFJ";
		var client_id = "AIH3NAKDXUPPLFQAHW1TIVXKVSGSZVRZL1FQYKU5FYTU2VN1";
		var url = '';
		var v = new Date().getTime();
		url += "https://api.foursquare.com/v2/venues/search?";
		url += $.param({'query': marker.title, 'client_id': client_id, 'client_secret': client_secret, 'v': v,});
		url += '&' + $.param({'ll':marker.getPosition().lat() + ',' +marker.getPosition().lng(), 'limit': 2, 'radius': 50});
		infowindow.marker = marker;

		$.getJSON(url, function (data) {
			if(data.response.venues.length > 0){
				infowindow.setContent('<div><a href="'+data.response.venues[0].url+'" target="_blank">' + marker.title + 
									  '</a></div><br><div>'+ data.response.venues[0].contact.formattedPhone + '</div><br><div>' + 
									  data.response.venues[0].location.address + '</div>');
			}
			else{
				infowindow.setContent('<div>' + marker.title + '</div><br><div>No data was able to be retrieved about this location</div>');
			}
		}).fail(function(jqxhr, textStatus, error){
			infowindow.setContent('<div>' + marker.title + '</div><br><div>There was an error retrieving data about this location</div>');
		});

		//Open it if it is not open
		infowindow.open(map, marker);
		infowindow.addListener('closeclick', function(){
			infowindow.marker = null;
			selectMarker.setIcon(makeMarkerIcon('009100'));
		});
	}

	//Close it if it is already open
	else{
		infowindow.marker = null;
		infowindow.close();
	}
}

// This function takes in a COLOR, and then creates a new marker
// icon of that color. The icon will be 21 px wide by 34 high, have an origin
// of 0, 0 and be anchored at 10, 34).
function makeMarkerIcon(markerColor) {
	var markerImage = new google.maps.MarkerImage(
		'http://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ markerColor +
		'|40|_|%E2%80%A2',
		new google.maps.Size(21, 34),
		new google.maps.Point(0, 0),
		new google.maps.Point(10, 34),
		new google.maps.Size(21,34));
	return markerImage;
}

//Handles the error sent from Google maps not working
function mapError(){
	window.alert("Error loading Google Maps API");
}

