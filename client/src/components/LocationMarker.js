import React from 'react';
import { useMapEvents } from 'react-leaflet';

function LocationMarker({ setCountry }) {
    useMapEvents({
        click: async (e) => {
            const { lat, lng } = e.latlng;
            const country = await fetchCountryFromCoords(lat, lng);
            setCountry(country); 
        }
    });

    return null; 
}

async function fetchCountryFromCoords(lat, lng) {
    try {
        const apiKey = 'd2c5d30ab85445bfb0d4aee4ae418526'; 
        const url = `https://api.opencagedata.com/geocode/v1/json?q=${lat}+${lng}&key=${apiKey}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch country data');

        const data = await response.json();
        return data.results[0].components.country;  
    } catch (error) {
        console.error('Error fetching country:', error);
        return ''; 
    }
}

export default LocationMarker;
