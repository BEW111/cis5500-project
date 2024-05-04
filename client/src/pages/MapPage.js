import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';  
import 'leaflet/dist/leaflet.css';
import ArtistDetails from '../components/ArtistDetails';
import LocationMarker from '../components/LocationMarker';  



function MapPage() {
    const [country, setCountry] = useState('');
    const [stats, setStats] = useState({ total_tracks: 0, total_playlists: 0, avg_tracks_per_playlist: 0 });
    const [genres, setGenres] = useState([]);
    const [loading, setLoading] = useState(false);


    useEffect(() => {
        if (country) {
            setLoading(true);
            Promise.all([
                fetch(`http://localhost:8080/artists/stats/${country}`),
                fetch(`http://localhost:8080/genres/top/${country}`)
            ]).then(async ([statsResponse, genresResponse]) => {
                if (!statsResponse.ok || !genresResponse.ok) {
                    throw new Error('Network response was not ok');
                }
                const statsData = await statsResponse.json();
                const genresData = await genresResponse.json();
                setStats(statsData);
                setGenres(genresData);
                setLoading(false);
            }).catch(error => {
                console.error('Error fetching data:', error);
                setStats({ total_tracks: 0, total_playlists: 0, avg_tracks_per_playlist: 0 });
                setGenres([]);
                setLoading(false);
            });
        }
    }, [country]);


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
                    {loading ? <p>Loading genres...</p> : genres.map(genre => (
                        <div key={genre.tag_name}>
                            <h4>{genre.year}: {genre.tag_name}</h4>
                            <p>Playlists: {genre.playlist_count}, Listeners: {genre.total_listeners}</p>
                        </div>
                    ))}
                </div>
                <ArtistDetails country={country} />
            </div>
        </div>
    );
}
  

export default MapPage;
