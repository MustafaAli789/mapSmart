var map, infoWindow, markers;
function createMap(){
	map = new google.maps.Map(document.getElementById("map"), {
		center: {lat: 45.4215, lng: -75.6972},
		zoom: 10
	});
	infoWindow = new google.maps.InfoWindow;
	var input = document.getElementById("searchBox");
	var searchBox = new google.maps.places.SearchBox(input);
	var placesService = new google.maps.places.PlacesService(map);
	markers = [];

	//biasing the search box to look within the current bounds of the map
	map.addListener("bounds_changed", function(){
		searchBox.setBounds(map.getBounds());
	});

	//upon detecting a location has been searched for and clicked
	searchBox.addListener("places_changed", function(){
		var placesFound = searchBox.getPlaces();

		if(placesFound.length===0)
			return;

		markers.forEach((marker)=>{
			marker.setMap(null); //get rid of map reference from marker
		})
		markers=[];

		var bounds = new google.maps.LatLngBounds();

		console.log(placesFound);

		//creating a marker at each place that is found
		placesFound.forEach((place)=>{
			if(!place.geometry)
				return;
			markers.push(createMarker(map, place.geometry.location, place.name))

			//To fit all markers within bounds of map
			if (place.geometry.viewport) {
	      		// Only geocodes have viewport.
	      		bounds.union(place.geometry.viewport);
	    	} else {
	      		bounds.extend(place.geometry.location);
	    	}
		});

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

function createMarker(map, pos, title){
	return new google.maps.Marker({position: pos, map: map})
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