var map, infoWindow, destinationMarkers;
var currentLocation; //an array containing the marker location and place info
var startingPointMarkers; //a 2d array contianing markers and associated place info
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
	currentLocation = [];

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

			if(currentLocation.length>0){
				currentLocation[0].setMap(null);
			}
			currentLocation=[];
		}

		var bounds = new google.maps.LatLngBounds();

		//creating markers at each place found and putting them at respective location
		for(var i = 0; i<placesToDisplay; i++){
			if(!placesFound[i].geometry)
				return;

			if(selectDestination.checked===true){
				destinationMarkers.push(createMarker(map, placesFound[i].geometry.location, placesFound[i].name, destinationIcon, null));
			} else{
				currentLocation.push(createMarker(map, placesFound[i].geometry.location, placesFound[i].name, currentLocationIcon, null));
				currentLocation.push(placesFound[i]);
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
			currentLocation.push(createMarker(map,usersPos, "Your Location", currentLocationIcon, null));
			currentLocation.push(null);
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
	let marker = new google.maps.Marker({position: pos, map: map, title: title, icon: icon,label: label});
	let infoWindow = new google.maps.InfoWindow({
		content: " "
	});
	marker.addListener("click", function(event){
		let markerIndex = Number(this.label);
		let contentString = `
		<div class="display-5" style="text-align: center; font-weight: bold;">${title}</div>
		<div style="display: flex; justify-content: space-around">
				<button style="margin: 10px;" data-toggle="tooltip" title="Remove" onclick="removeLocation(${markerIndex})" type="button" class="centerBtn btn btn-outline-dark"><i class="far fa-trash-alt"></i></button>
				<button style="margin: 10px;" title="Info" onclick="modalTest(${markerIndex})" data-toggle="modal" data-target="#infoModal" type="button" class="favBtn btn btn-outline-dark"><i class="far fa-question-circle"></i></button>
				<button style="margin: 10px;" data-toggle="tooltip" title="Save" type="button" class="favBtn btn btn-outline-dark"><i class="far fa-star"></i></button>
		</div>
		`;
		//if its a current location marker, does not need remove button as well
		if(icon===currentLocationIcon){
			contentString=`
			<div class="display-5" style="text-align: center;">${title}</div>
			<div style="display: flex; justify-content: space-around">
				<button style="margin: 10px;" data-toggle="modal" data-target="#infoModal" title="Info" type="button" class="favBtn btn btn-outline-dark"><i class="far fa-question-circle"></i></button>
				<button style="margin: 10px;" data-toggle="tooltip" title="Save" type="button" class="favBtn btn btn-outline-dark"><i class="far fa-star"></i></button>
			</div>
			`;
		}
		infoWindow.setContent(contentString);
		infoWindow.open(map, marker);
	});
	return marker;
}

function handleLocationError(geolocationInBrowser, position){
	if(geolocationInBrowser){
		console.log("Location access denied. Centering on Ottawa");
	}
	else{
		console.log("Geolocation not supported. Centering on Ottawa");
	}
	map.panTo(position);
	currentLocation.push(createMarker(map,position, "Ottawa", currentLocationIcon, null));
	currentLocation.push(null);
}

addBtn.addEventListener("click", ()=>{
	if(currentLocation.length>0){
		let markerDoesntExist = true;

		//ensuring that the current selected starting point hasnt been previously selected
		startingPointMarkers.forEach((place)=>{
			if(place[0].position===currentLocation[0].position){
				markerDoesntExist=false;
				alert("That starting point is already selected");
			}
		});
		if(markerDoesntExist) 
			startingPointMarkers.push([createMarker(map,currentLocation[0].position, currentLocation[0].title, null, (startingPointLabels++).toString(10)), currentLocation[1]]);
	}
});

//pans the map to the current selected location
centerBtn.addEventListener("click", ()=>{
	map.panTo(currentLocation[0].position);
});

//fit all visible markers in the view of the map
showAllBtn.addEventListener("click", ()=>{
	let bounds = new google.maps.LatLngBounds();
	startingPointMarkers.forEach((place)=>{
		bounds.extend(place[0].position);
	});
	if(startingPointMarkers.length>0)
		map.fitBounds(bounds);
});

//removes a location if the remove button is clicked
function removeLocation(markerIndex){
	let position = startingPointMarkers[markerIndex][0].position;
	startingPointMarkers.forEach((place, index)=>{
		if(place[0].position===position){
			startingPointMarkers[index][0].setMap(null);
			startingPointMarkers.splice(index, 1);
			startingPointLabels-=1;

			//this is to update the labels (reduce all by 1 starting at index of removal)
			for(var i = index; i<startingPointMarkers.length; i++){
				let markerLabel = Number(startingPointMarkers[i][0].label);
				markerLabel-=1;
				startingPointMarkers[i][0].set('label', markerLabel.toString(10));
			}


		}
	});
}

function modalTest(markerIndex){
	startingPointMarkers.forEach((place)=>{
		if(place[0].label==markerIndex)
			document.getElementById("infoModalTitle").textContent=place[0].title;
	});
}
