import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';  
import 'leaflet/dist/leaflet.css';


function LocationMarker() {
    useMapEvents({
      click: (e) => {
        // e.latlng contains the LatLng object of where the click happened
        const { lat, lng } = e.latlng;
        console.log(`Clicked at latitude: ${lat}, longitude: ${lng}`);  // Print coordinates to console
      }
    });
  
    return null;  // This component does not render anything
  }

function MapPage() {
    return ( 
        // Make sure you set the height and width of the map container otherwise the map won't show
          <MapContainer center={[39.50, -98.35]} zoom={3} style={{height: "100vh", width: "100vw"}}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationMarker />
          </MapContainer>



      );
}

export default MapPage;
