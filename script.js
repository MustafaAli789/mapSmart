var map, infoWindow, markers;
const selectDestination = document.getElementById("defaultCheck1");

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

	//upon detecting a location has been searched by clicking on one or pressing enter
	searchBox.addListener("places_changed", function(){
		var placesFound = searchBox.getPlaces();

		if(placesFound.length===0)
			return;

		markers.forEach((marker)=>{
			marker.setMap(null); //get rid of map reference from marker
		})
		markers=[];

		var bounds = new google.maps.LatLngBounds();
		let placesToDisplay = 1;

		selectDestination.checked===true ? placesToDisplay=placesFound.length : placesToDisplay=1;

		debugger;

		//creating markers at each place found and putting them at respective location
		for(var i = 0; i<placesToDisplay; i++){
			if(!placesFound[i].geometry)
				return;

			markers.push(createMarker(map, placesFound[i].geometry.location, placesFound[i].name))

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

function createMarker(map, pos, title){
	return new google.maps.Marker({position: pos, map: map, title: title})
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