var map, infoWindow, currentLocationMarkers, destinationMarkers, startingPointMarkers;
var currentLocationIcon = "static/icons/currentLocationIcon.png";
var destinationIcon = "static/icons/destinationIcon.png";
const selectDestination = document.getElementById("defaultCheck1");


function createMap(){
	map = new google.maps.Map(document.getElementById("map"), {
		center: {lat: 45.4215, lng: -75.6972},
		zoom: 10
	});
	infoWindow = new google.maps.InfoWindow;
	var input = document.getElementById("searchBox");
	var searchBox = new google.maps.places.SearchBox(input);

	//no markers assigned as of yet
	startingPointMarkers = destinationMarkers = currentLocationMarkers = [];

	//biasing the search box to look within the current bounds of the map
	map.addListener("bounds_changed", function(){
		searchBox.setBounds(map.getBounds());
	});

	//upon detecting a location has been searched by clicking on one or pressing enter
	searchBox.addListener("places_changed", function(){
		var placesFound = searchBox.getPlaces();
		let placesToDisplay = 1;

		if(placesFound.length===0)
			return;

		//searching for destination vs starting point
		if(selectDestination.checked===true){
			placesToDisplay = placesFound.length;
			destinationMarkers.forEach((marker)=>{
				marker.setMap(null); //get rid of map reference from marker
			});
			destinationMarkers=[];
		} else{
			placesToDisplay = 1;

			//current location is technically only one marker however an array is needed
			//as on first run, it is not a marker so cant set it to null
			currentLocationMarkers.forEach((marker)=>{
				marker.setMap(null);
			});
			currentLocationMarkers=[];
		}

		var bounds = new google.maps.LatLngBounds();

		//creating markers at each place found and putting them at respective location
		for(var i = 0; i<placesToDisplay; i++){
			if(!placesFound[i].geometry)
				return;

			if(selectDestination.checked===true){
				destinationMarkers.push(createMarker(map, placesFound[i].geometry.location, placesFound[i].name, destinationIcon));
			} else{
				currentLocationMarkers.push(createMarker(map, placesFound[i].geometry.location, placesFound[i].name, currentLocationIcon));
			}

			//To fit all markers within bounds of map
			if (placesFound[i].geometry.viewport) {
	      		// Only geocodes have viewport.
	      		bounds.union(placesFound[i].geometry.viewport);
	    	} else {
	      		bounds.extend(placesFound[i].geometry.location);
	    	}
		};

    	map.fitBounds(bounds);

	});

	//Utilizing HTML5 Geolocation to get users current location
	if(navigator.geolocation){
		navigator.geolocation.getCurrentPosition(function(pos){
			var usersPos = {
				lat: pos.coords.latitude,
				lng: pos.coords.longitude
			};
			map.panTo(usersPos);
			infoWindow.setContent("Your location");
			infoWindow.setPosition(usersPos);
			infoWindow.open(map);
		}, function(){
			//User has denied location access
			handleLocationError(true, map.getCenter());
		});
	} else{
		//Browser doesnt support the geolocation feature
		handleLocationError(false, map.getCenter());
	}
}

function createMarker(map, pos, title, icon){
	return new google.maps.Marker({position: pos, map: map, title: title, icon: icon})
}

function handleLocationError(geolocationInBrowser, position){
	if(geolocationInBrowser){
		infoWindow.setContent("Location access denied. Centering on Ottawa");
	}
	else{
		infoWindow.setContent("Geolocation not supported. Centering on Ottawa");
	}
	infoWindow.setPosition(position);
	infoWindow.open(map);
	map.panTo(pos);
}