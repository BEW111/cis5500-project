import React from 'react';

function GenreCard({ genre }) {
    const cardStyle = {
        padding: '10px',
        marginBottom: '1rem',
        backgroundColor: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        border: '1px solid #eee'
    };

    return (
        <div style={cardStyle}>
            <h4>{genre.year}: {genre.tag_name}</h4>
            <p>Playlists: {genre.playlist_count}, Listeners: {genre.total_listeners}</p>
        </div>
    );
}

export default GenreCard;
