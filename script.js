var map, infoWindow, currentLocationMarkers, destinationMarkers, startingPointMarkers;
var currentLocationIcon = "static/icons/currentLocationIcon.png";
var destinationIcon = "static/icons/destinationIcon.png";
const selectDestination = document.getElementById("defaultCheck1");
const addBtn = document.getElementById("addBtn");
const centerBtn = document.getElementById("centerBtn");
const showAllBtn = document.getElementById("showAllBtn");

var startingPointLabels = 0;

function createMap(){
	map = new google.maps.Map(document.getElementById("map"), {
		center: {lat: 45.4215, lng: -75.6972},
		zoom: 10
	});
	var input = document.getElementById("searchBox");
	var searchBox = new google.maps.places.SearchBox(input);

	//no markers assigned as of yet
	startingPointMarkers = []; 
	destinationMarkers = [];
	currentLocationMarkers = [];

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
				destinationMarkers.push(createMarker(map, placesFound[i].geometry.location, placesFound[i].name, destinationIcon, null));
			} else{
				currentLocationMarkers.push(createMarker(map, placesFound[i].geometry.location, placesFound[i].name, currentLocationIcon, null));
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
			currentLocationMarkers.push(createMarker(map,usersPos, "Your Location", currentLocationIcon, null));
		}, function(){
			//User has denied location access
			handleLocationError(true, map.getCenter());
		});
	} else{
		//Browser doesnt support the geolocation feature
		handleLocationError(false, map.getCenter());
	}
}

function createMarker(map, pos, title, icon, label){
	return new google.maps.Marker({position: pos, map: map, title: title, icon: icon,label: label})
}

function handleLocationError(geolocationInBrowser, position){
	if(geolocationInBrowser){
		console.log("Location access denied. Centering on Ottawa");
	}
	else{
		console.log("Geolocation not supported. Centering on Ottawa");
	}
	map.panTo(position);
	currentLocationMarkers.push(createMarker(map,position, "Ottawa", currentLocationIcon, null));
}

addBtn.addEventListener("click", ()=>{
	if(currentLocationMarkers.length>0){
		let markerDoesntExist = true;

		//ensuring that the current selected starting point hasnt been previously selected
		startingPointMarkers.forEach((marker)=>{
			if(marker.position===currentLocationMarkers[0].position){
				markerDoesntExist=false;
				alert("That starting point is already selected");
			}
		});
		if(markerDoesntExist) 
			startingPointMarkers.push(createMarker(map,currentLocationMarkers[0].position, currentLocationMarkers[0].title, null, (startingPointLabels++).toString(10)));
	}
});

//pans the map to the current selected location
centerBtn.addEventListener("click", ()=>{
	map.panTo(currentLocationMarkers[0].position);
});

//fit all visible markers in the view of the map
showAllBtn.addEventListener("click", ()=>{
	let bounds = new google.maps.LatLngBounds();
	startingPointMarkers.forEach((marker)=>{
		bounds.extend(marker.position);
	});
	map.fitBounds(bounds);
});