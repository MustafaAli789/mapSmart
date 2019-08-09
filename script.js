var map, infoWindow;
var destinationLocations; //a2d array containing markers and associated place info as well as if info is cached or not
var currentLocation; //an array containing the marker location and place info as well as if info is cached or not
var startingLocations; //a 2d array contianing markers and associated place info as well as if info is cached or not

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
	infoWindow = new google.maps.InfoWindow({
		content: " "
	});
	var input = document.getElementById("searchBox");
	var searchBox = new google.maps.places.SearchBox(input);

	//no markers assigned as of yet
	startingLocations = []; 
	destinationLocations = [];
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
			destinationLocations.forEach((place)=>{
				place[0].setMap(null); //get rid of map reference from marker
			});
			destinationLocations=[];
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
				destinationLocations.push([createMarker(map, placesFound[i].geometry.location, placesFound[i].name, destinationIcon, null), placesFound[i], false]);
			} else{
				currentLocation.push(createMarker(map, placesFound[i].geometry.location, placesFound[i].name, currentLocationIcon, null));
				currentLocation.push(placesFound[i]);
				currentLocation.push(false);
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
			debugger;
			var usersPos = {
				lat: pos.coords.latitude,
				lng: pos.coords.longitude
			};
			map.panTo(usersPos);
			currentLocation.push(createMarker(map,usersPos, "Your Location", currentLocationIcon, null));
			currentLocation.push({formatted_address: null});
			currentLocation.push(false);
			
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
	marker.addListener("click", function(event){
		let markerIndex = Number(this.label);
		let contentString = `
		<div class="display-5" style="text-align: center; font-weight: bold;">${title}</div>
		<div style="display: flex; justify-content: space-around">
				<button style="margin: 10px; width: 45px;" data-toggle="tooltip" title="Remove" onclick="removeLocation('${marker.position.lat()}, ${marker.position.lng()}', 'starting')" type="button" class="centerBtn btn btn-outline-dark"><i class="far fa-trash-alt"></i></button>
				<button style="margin: 10px; width: 45px;" title="Info" onclick="setLocationInfoInModal('${marker.position.lat()}, ${marker.position.lng()}', 'starting')" data-toggle="modal" data-target="#infoModal" type="button" class="favBtn btn btn-outline-dark"><i class="far fa-question-circle"></i></button>
				<button style="margin: 10px; width: 45px;" data-toggle="tooltip" title="Save" type="button" class="favBtn btn btn-outline-dark"><i class="far fa-star"></i></button>
		</div>
		`;

		if(icon===destinationIcon){
			contentString = `
			<div class="display-5" style="text-align: center; font-weight: bold;">${title}</div>
			<div style="display: flex; justify-content: space-around">
				<button style="margin: 10px; width: 45px;" data-toggle="tooltip" title="Remove" onclick="removeLocation('${marker.position.lat()}, ${marker.position.lng()}', 'destination')" type="button" class="centerBtn btn btn-outline-dark"><i class="far fa-trash-alt"></i></button>
				<button style="margin: 10px; width: 45px;" title="Info" onclick="setLocationInfoInModal('${marker.position.lat()}, ${marker.position.lng()}', 'destination')" data-toggle="modal" data-target="#infoModal" type="button" class="favBtn btn btn-outline-dark"><i class="far fa-question-circle"></i></button>
				<button style="margin: 10px; width: 45px;" data-toggle="tooltip" title="Save" type="button" class="favBtn btn btn-outline-dark"><i class="far fa-star"></i></button>
			</div>
		`;
		}
		
		//if its a current location marker, does not need remove button as well
		if(icon===currentLocationIcon){
			contentString=`
			<div class="display-5" style="text-align: center;">${title}</div>
			<div style="display: flex; justify-content: space-around">
				<button style="margin: 10px; width: 45px;" onclick="setLocationInfoInModal('${marker.position.lat()}, ${marker.position.lng()}', 'current')" data-toggle="modal" data-target="#infoModal" title="Info" type="button" class="favBtn btn btn-outline-dark"><i class="far fa-question-circle"></i></button>
				<button style="margin: 10px; width: 45px;" data-toggle="tooltip" title="Save" type="button" class="favBtn btn btn-outline-dark"><i class="far fa-star"></i></button>
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
	currentLocation.push({formatted_address: null});
	currentLocation.push(false);
}

addBtn.addEventListener("click", ()=>{
	if(currentLocation.length>0){
		let markerDoesntExist = true;

		//ensuring that the current selected starting point hasnt been previously selected
		startingLocations.forEach((place)=>{
			if(place[0].position===currentLocation[0].position){
				markerDoesntExist=false;
				alert("That starting point is already selected");
			}
		});
		if(markerDoesntExist) 
			startingLocations.push([createMarker(map,currentLocation[0].position, currentLocation[0].title, null, (startingPointLabels++).toString(10)), currentLocation[1], currentLocation[2]]); 
	}
});

//pans the map to the current selected location
centerBtn.addEventListener("click", ()=>{
	map.panTo(currentLocation[0].position);
});

//fit all visible markers in the view of the map
showAllBtn.addEventListener("click", ()=>{
	let bounds = new google.maps.LatLngBounds();
	startingLocations.forEach((place)=>{
		bounds.extend(place[0].position);
	});
	if(startingLocations.length>0)
		map.fitBounds(bounds);
});

//removes a marker, requires the lat and lng as "lat, lng" as well as type of location being removed
function removeLocation(position, typeOfLocation){
	let place = getLocationInfo(position, typeOfLocation);
	if(typeOfLocation==="starting"){
		let indexOfPlace = startingLocations.indexOf(place);
		startingLocations.splice(startingLocations.indexOf(place), 1);
		startingPointLabels-=1;

		//this is to update the labels (reduce all by 1 starting at index of removal)
		for(var i = indexOfPlace; i<startingLocations.length; i++){
			let markerLabel = Number(startingLocations[i][0].label);
			markerLabel-=1;
			startingLocations[i][0].set('label', markerLabel.toString(10));
		}	
		
	} else if(typeOfLocation==="destination"){
		destinationLocations.splice(destinationLocations.indexOf(place), 1);
	}
	place[0].setMap(null);
}

//tales a position in 'lat, lng' as well as a type of location and displays info in the modal
function setLocationInfoInModal(position, typeOfLocation){

	let place = getLocationInfo(position, typeOfLocation);
	debugger;
	
	//if its true, that means detailed info for that place has already been requested before 
	if(!place[2]==true){
		let location = new google.maps.LatLng(place[0].position.lat(), place[0].position.lng());
		makePlaceDetailsServiceRequest(place[0].title, location, typeOfLocation);
	} else{
		updateModalContents(place[1]);
	}
	

}

//takes a detailed place object and updates the modal text
function updateModalContents(place){
	
	if(place===null){
		document.getElementById("infoModalTitle").textContent="No name to display";
		document.getElementById("addres").textContent="No address info to display.";
		document.getElementById("phoneNum").textContent="No phone number info to display.";
		document.getElementById("website").textContent="No website info to display.";
		document.getElementById("hours").textContent="No hours info to display.";
		document.getElementById("rating").textContent="No rating info to display.";
		document.querySelector(".carousel-inner").innerHTML=""; //clearing images
		return
	}
	
	document.getElementById("infoModalTitle").textContent=place.name;

	
	if(place.formatted_address!=null){
		document.getElementById("addres").textContent=place.formatted_address;
	} else{		
		document.getElementById("addres").textContent="No address info to display.";
	}

	if(place.formatted_phone_number!=null){
		document.getElementById("phoneNum").textContent=place.formatted_phone_number;
	} else{		
		document.getElementById("phoneNum").textContent="No phone number info to display.";
	}

	if(place.website!=null){
		document.getElementById("website").textContent=place.website;
	} else{		
		document.getElementById("website").textContent="No website info to display.";
	}

	if(place.opening_hours!=null){
		if(place.opening_hours.weekday_text!=null){
			document.getElementById("hours").textContent=place.opening_hours.weekday_text.flat();
		} else{
			document.getElementById("hours").textContent="No hours info to display.";

		}
	} else{		
		document.getElementById("hours").textContent="No hours info to display.";
	}

	if(place.rating!=null){
		document.getElementById("rating").textContent=place.rating;
	} else{		
		document.getElementById("rating").textContent="No rating info to display.";
	}
	
	if(place.photos!=null && place.photos.length>0){
		setModalPhotos(place.photos);
	}
}

//takes an array of photo objects with a method to retrieve their urls and puts them in the modal
function setModalPhotos(photos){
	let carousel = document.querySelector(".carousel-inner");
	carousel.innerHTML="";
	photos.forEach((photo, index)=>{
		let photoSrc = photo.getUrl();
		let newPhoto = document.createElement("div");
		newPhoto.setAttribute("class", "carousel-item-active");
		newPhoto.innerHTML =`
		<img style="object-fit: cover; height: 250px;" class="d-block w-100" src="${photoSrc}" alt="Slide ${index}">
		`
		carousel.appendChild(newPhoto);
	});
}

//gets detailed location info, takes a search query and type of location for which info is being obtained (ex: starting)
//place is the array containing the marker and associated place info that was clicked
function makePlaceDetailsServiceRequest(query, loc, typeOfLocation){
	 let request = {
		query: query,
		location: loc,
		radius: 1
	};
	
	var service = new google.maps.places.PlacesService(map);

	  service.textSearch(request, function(results, status) {
		if (status === google.maps.places.PlacesServiceStatus.OK) {
		  for (var i = 0; i < results.length; i++) {
			
			let resultLat = results[i].geometry.location.lat();
			let resultLng = results[i].geometry.location.lng();
			let destination = null;
			let starting = null;

			try{
				//ensuring that the place services has found the matching destination or starting point
				if(typeOfLocation==="destination"){

					destinationLocations.forEach((place)=>{
						if(place[1].geometry.location.lat()===resultLat && place[1].geometry.location.lng()===resultLng)
							destination = place;
					});

					if(destination===null)
						continue;
				} else if(typeOfLocation==="starting"){
				
					if(startingLocations.length===1)
						starting=startingLocations[0];
					else{
						startingLocations.forEach((place)=>{
							if(place[1].geometry.location.lat()===resultLat && place[1].geometry.location.lng()===resultLng)
								starting = place;
						});
					}

					if(starting===null)
						continue;
				}	
			}catch(error){
				console.log(error);
				alert("Ran into an error, unable to request palce information.");
				updateModalContents(null);
				break;
			}

			

			let placeId = results[i].place_id;
			
			var detailedRequest = {
				placeId: placeId,
				fields: ['formatted_address', 'formatted_phone_number', 'website', 'opening_hours', 'rating', 'photo', 'name', 'geometry']
			};
			
			service = new google.maps.places.PlacesService(map);
			service.getDetails(detailedRequest, (placeDetailed, status)=>{
				if(typeOfLocation==="current"){
					currentLocation[1]=placeDetailed;
					currentLocation[2]=true;
					updateModalContents(placeDetailed);
				} else if(typeOfLocation==="starting"){
					startingLocations[startingLocations.indexOf(starting)][1]=placeDetailed;
					startingLocations[startingLocations.indexOf(starting)][2]=true;
					updateModalContents(placeDetailed);
				} else if(typeOfLocation==="destination"){
					destinationLocations[destinationLocations.indexOf(destination)][1]=placeDetailed;
					destinationLocations[destinationLocations.indexOf(destination)][2]=true;
					updateModalContents(placeDetailed);
				}
			});	
			break; //once place service has matched to a current, starting or destination, no further results are needed
		  }
		  if(results.length===0)
			  updateModalContents(null);
		}
	  });
	
}

//returns a place array with marker and associated place info
//type of location is used when you know which type of location to expect
function getLocationInfo(position, typeOfLocation){
	let lat = Number(position.substr(0, position.indexOf(',')));
	let lng = Number(position.substr(position.indexOf(',')+2, position.length-1));
	if(currentLocation[0].position.lat()===lat && currentLocation[0].position.lng()===lng && (typeOfLocation==="current"||typeOfLocation===null))
		return currentLocation;
	for(var i =0;i<startingLocations.length; i++){
		if(startingLocations[i][0].position.lat()===lat && startingLocations[i][0].position.lng()===lng && (typeOfLocation==="starting"||typeOfLocation===null))
			return startingLocations[i];
	}
	for(var i = 0; i<destinationLocations.length; i++){
		if(destinationLocations[i][0].position.lat()===lat && destinationLocations[i][0].position.lng()===lng && (typeOfLocation==="destination"||typeOfLocation===null))
			return destinationLocations[i];
	}
}


