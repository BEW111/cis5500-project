import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';  
import 'leaflet/dist/leaflet.css';
import ArtistDetails from '../components/ArtistDetails';
import LocationMarker from '../components/LocationMarker';  


function MapPage() {
    const [country, setCountry] = useState('');

    return (
        <div style={{ display: 'flex', height: '100vh' }}>
            <div style={{ flex: 2 }}>
                <MapContainer center={[39.50, -98.35]} zoom={3} style={{height: "100%", width: "100%"}}>
                    <TileLayer
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <LocationMarker setCountry={setCountry} />
                </MapContainer>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
                <ArtistDetails country={country} />
            </div>
        </div>
    );
}
  

export default MapPage;
