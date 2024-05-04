import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';  
import 'leaflet/dist/leaflet.css';
import ArtistDetails from '../components/ArtistDetails';
import LocationMarker from '../components/LocationMarker';  



function MapPage() {
    const [country, setCountry] = useState('');
    const [stats, setStats] = useState({ total_tracks: 0, total_playlists: 0, avg_tracks_per_playlist: 0 });


    useEffect(() => {
        if (country) {
        fetch(`http://localhost:8080/artists/stats/${country}`)
            .then(response => {
                if (!response.ok) {
                    setStats({ total_tracks: 0, total_playlists: 0, avg_tracks_per_playlist: 0 });
                    throw new Error('Network response was not ok');
                }
                return response.json();
            })
            .then(data => {
                setStats(data);
            })
            .catch(error => {
                setStats({ total_tracks: 0, total_playlists: 0, avg_tracks_per_playlist: 0 });
                console.error('Error fetching artist stats:', error);
            });
    }}, [country]);


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
                <div>
                    <h2>Statistics for {country} Artists</h2>
                    <p>Total Tracks: {stats.total_tracks}</p>
                    <p>Total Playlists: {stats.total_playlists}</p>
                    <p>Average Tracks per Playlist: {stats.avg_tracks_per_playlist.toFixed(2)}</p>
                </div>
                {/* <ArtistDetails country={country} /> */}
            </div>
        </div>
    );
}
  

export default MapPage;
