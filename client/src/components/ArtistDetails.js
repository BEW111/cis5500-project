import React, { useState, useEffect } from 'react';

function ArtistDetails({ country }) {
    const [artists, setArtists] = useState([]);

    useEffect(() => {
        if (!country) return;  // Do not fetch if country is not set

        const fetchArtistDetails = async () => {
            console.log(`Fetching details for country: ${country}`);
            const url = `http://localhost:8080/artists/details/${country}`;
            console.log(`URL: ${url}`);
            try {
                const response = await fetch(url);
                const data = await response.json();
                setArtists(data);
            } catch (error) {
                console.error('Failed to fetch artist details:', error);
                setArtists([]);  // Reset the artists on error
            }
        };

        fetchArtistDetails();
    }, [country]);  // Fetch new details when country changes

    return (
        <div>
            {artists.length > 0 ? (
                artists.map(artist => (
                    <div key={artist.mbid} style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
                        <h3>{artist.name}</h3>
                        <p>Listeners: {artist.listeners}</p>
                        <p>Scrobbles: {artist.scrobbles}</p>
                        <p>Playlists Featured In: {artist.num_playlists}</p>
                        <p>Tags: {artist.tags}</p>
                    </div>
                ))
            ) : (
                <p>No artists found for {country}</p>
            )}
        </div>
    );
}

export default ArtistDetails;
