import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';  
import 'leaflet/dist/leaflet.css';
import ArtistDetails from '../components/ArtistDetails';
import GenreCard from '../components/GenreCard';
import LocationMarker from '../components/LocationMarker';  



function MapPage() {
    const [country, setCountry] = useState(null);
    const [stats, setStats] = useState({ valid: false, total_tracks: 0, total_playlists: 0, avg_tracks_per_playlist: 0 });
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
                setStats(validateStats(statsData));
                setGenres(genresData || []);
                setLoading(false);
            }).catch(error => {
                console.error('Error fetching data:', error);
                setStats({ total_tracks: 0, total_playlists: 0, avg_tracks_per_playlist: 0 });
                setGenres([]);
                setLoading(false);
            });
        }
    }, [country]);

    function validateStats(data) {
        let isValid = true; 
    
        const totalTracks = data.total_tracks || 0;
        const totalPlaylists = data.total_playlists || 0;
        const avgTracksPerPlaylist = Number(data.avg_tracks_per_playlist);
    
        if (!data.total_tracks || !data.total_playlists || isNaN(avgTracksPerPlaylist)) {
            isValid = false; 
        }
    
        return {
            valid: isValid,
            total_tracks: totalTracks,
            total_playlists: totalPlaylists,
            avg_tracks_per_playlist: avgTracksPerPlaylist || 0,
        };
    }

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
{country ? (
                <div>
                    <h2>Top Artists In {country}</h2>
                    <ArtistDetails country={country} />
                    <h2>Artist Statistics</h2>
                    {loading ? <p>Loading artist statistics...</p> : (
                        stats.valid ? (
                            <div>
                                <h3>Total Tracks: {stats.total_tracks}</h3>
                                <h3>Total Playlists: {stats.total_playlists}</h3>
                                <h3>Average Tracks per Playlist: {stats.avg_tracks_per_playlist.toFixed(2)}</h3>
                            </div>
                        ) : (
                            <p>Data unavailable or invalid for the selected country.</p>
                        )
                    )}
                    <h2>Top Genres</h2>
                    {loading ? <p>Loading genres...</p> : genres.map(genre => <GenreCard key={genre.tag_name} genre={genre} />)}
                </div>
            ) : (
                <p>Please click on a country to view artist and genre statistics.</p>
            )}
            </div>
        </div>
    );
}
  

export default MapPage;
