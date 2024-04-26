import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';  
import 'leaflet/dist/leaflet.css';


// function LocationMarker() {
//     useMapEvents({
//       click: (e) => {
//         // e.latlng contains the LatLng object of where the click happened
//         const { lat, lng } = e.latlng;
//         console.log(`Clicked at latitude: ${lat}, longitude: ${lng}`);  // Print coordinates to console
//       }
//     });
  
//     return null;  // This component does not render anything
//   }


// function LocationMarker() {
//     const [locationInfo, setLocationInfo] = useState('');  // State to store location information

//     useMapEvents({
//       click: async (e) => {
//         const { lat, lng } = e.latlng;
//         const apiKey = "d2c5d30ab85445bfb0d4aee4ae418526";
//         const requestUrl = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}`;

//         try {
//           const response = await fetch(requestUrl);
//           const data = await response.json();
//           if (data.results.length > 0) {
//             const country = data.results[0].components.country;
//             console.log(`Clicked at latitude: ${lat}, longitude: ${lng} in country: ${country}`);
//             setLocationInfo(`Latitude: ${lat}, Longitude: ${lng}, Country: ${country}`);
//           } else {
//             console.log("No results found for this location.");
//             setLocationInfo("No results found for this location.");
//           }
//         } catch (error) {
//           console.error('Error fetching location data:', error);
//         }
//       }
//     });
  
//     return (
//       <div style={{ position: "absolute", top: 0, right: 0, padding: "10px", backgroundColor: "rgba(255,255,255,0.8)" }}>
//         <p>{locationInfo}</p>
//       </div>
//     );  // Display the location information on the map
// }

function LocationMarker() {
    const [locationInfo, setLocationInfo] = useState('');

    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng;
        const apiKey = "d2c5d30ab85445bfb0d4aee4ae418526";
        const geocodeUrl = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}`;

        try {
          const response = await fetch(geocodeUrl);
          const data = await response.json();
          const country = data.results[0].components.country;
          console.log(`Clicked at latitude: ${lat}, longitude: ${lng} in country: ${country}`);
          setLocationInfo(`Latitude: ${lat}, Longitude: ${lng}, Country: ${country}`);

          // Fetch artists from your server based on the country
          const artistsResponse = await fetch(`http://localhost:8080/artists/${country}`);
          const artistsData = await artistsResponse.json();
          console.log('Artists from:', country, artistsData);
        } catch (error) {
          console.error('Error fetching data:', error);
        }
      }
    });

    return (
      <div style={{ position: "absolute", top: 0, right: 0, padding: "10px", backgroundColor: "rgba(255,255,255,0.8)" }}>
        <p>{locationInfo}</p>
      </div>
    );
}


  

function MapPage() {
    return ( 
        <div style={{ display: 'flex', height: '100vh' }}>
            <div style={{ flex: 2 }}>
          <MapContainer center={[39.50, -98.35]} zoom={3} style={{height: "100%", width: "100%"}}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker />
          </MapContainer>
          </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                <p> hello</p>
            </div>
        </div>


      );
}

export default MapPage;
