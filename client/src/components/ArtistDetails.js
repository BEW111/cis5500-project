import React, { useState, useEffect } from 'react';

function ArtistDetails({ country }) {
    const [artists, setArtists] = useState([]);
    const [loading, setLoading] = useState(false);  


    useEffect(() => {
        if (!country) return; 

        const fetchArtistDetails = async () => {
            setLoading(true);
            console.log(`Fetching details for country: ${country}`);
            const url = `http://localhost:8080/artists/list/${country}`;
            console.log(`URL: ${url}`);
            try {
                const response = await fetch(url);
                if (!response.ok) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setArtists(data);
            } catch (error) {
                console.error('Failed to fetch artist details:', error);
                setArtists([]);  // Reset the artists on error
            } finally {
                setLoading(false);  // Set loading to false after fetching
            }
        };

        fetchArtistDetails();
    }, [country]);  // Fetch new details when country changes

    return (
        // <div>
        //     {artists.length > 0 ? (
        //         artists.map(artist => (
        //             <div key={artist.mbid} style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
        //                 <h3>{artist.name}</h3>
        //                 <p>Listeners: {artist.listeners}</p>
        //                 <p>Scrobbles: {artist.scrobbles}</p>
        //                 <p>Playlists Featured In: {artist.num_playlists}</p>
        //                 <p>Tag: {artist.top_tag}</p>
        //             </div>
        //         ))
        //     ) : (
        //         <p>No artists found for {country}</p>
        //     )}
        // </div>
        <div>
            {loading ? (
                <p>Loading artist details...</p>  // Display loading message
            ) : artists.length > 0 ? (
                artists.map(artist => (
                    <div key={artist.mbid} style={{ padding: '10px', borderBottom: '1px solid #ccc' }}>
                        <h3>{artist.name}</h3>
                        <p>Listeners: {artist.listeners}</p>
                        <p>Scrobbles: {artist.scrobbles}</p>
                        <p>Playlists Featured In: {artist.num_playlists}</p>
                        <p>Tag: {artist.top_tag}</p>
                    </div>
                ))
            ) : (
                <p>{country} doesn't have any worldwide diverse artists yet!</p>
            )}
        </div>
    );
}

export default ArtistDetails;
