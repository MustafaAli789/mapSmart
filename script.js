var map, infoWindow;
function createMap(){
	map = new google.maps.Map(document.getElementById("map"), {
		center: {lat: 45.4215, lng: -75.6972},
		zoom: 10
	})
	infoWindow = new google.maps.InfoWindow;

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