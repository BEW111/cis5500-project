import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Button, Stack} from '@mui/material';
import { NavLink } from 'react-router-dom';

const config = require('../config.json');



export default function SongInfoPage() {
    const { id } = useParams();
    const [trackName, setTrackName] = useState('N/A');
    const [albumName, setAlbumName] = useState('N/A');
    const [artistId, setArtistId] = useState('N/A');
    const [country, setCountry] = useState('N/A');
    const [tag, setTag] = useState('N/A');
    const [listeners, setListeners] = useState('N/A');
    const [artistName, setArtistName] = useState('N/A');
    const [recommendation1Data, setRecommendation1Data] = useState({})
    const [recommendation2Data, setRecommendation2Data] = useState({})


    useEffect(() => {   
        fetch(`http://${config.server_host}:${config.server_port}/getSongInfo/${id}`)
          .then(res => res.json())
          .then(
            resJson => {
                const songReturn = resJson;
                setTrackName(songReturn.track_name);
                setAlbumName(songReturn.album_name);
                setArtistId(songReturn.artist_id);
            } 
        );
      }, [id]);

      useEffect(() => {   
        fetch(`http://${config.server_host}:${config.server_port}/getArtistInfo/${artistId}`)
          .then(res => res.json())
          .then(
            resJson => {
                const songReturn = resJson;
                setArtistName(songReturn.artist_name);
                setCountry(songReturn.country);
                setListeners(songReturn.listeners)
                     
            } 
        );
      }, [artistId]);


    useEffect(() => {   
        fetch(`http://${config.server_host}:${config.server_port}/getArtistTags/${artistId}`)
          .then(res => res.json())
          .then(
            resJson => {
                const songReturn = resJson;
                setTag(songReturn.tag);      
            } 
        );
      }, [artistName]);

    const recommendation1 = () => {
        fetch(`http://${config.server_host}:${config.server_port}/recommendation1/${artistId}/${country}/${tag}/${listeners}`)
          .then(res => res.json())
          .then(resJson => setRecommendation1Data(resJson));
    }

    const recommendation2 = () => {
        fetch(`http://${config.server_host}:${config.server_port}/recommendation2/${id}`)
          .then(res => res.json())
          .then(resJson => setRecommendation2Data(resJson));
    }

    return (
        <Container>
            <Stack>
            <h1 style={{ fontSize: 64 }}>{trackName}</h1>
            <h2>Background Info:</h2>
            <p>Album: {albumName}</p>
            <p>Artist: {artistName}</p>
            <p>Country: {country}</p>
            <p>Listeners: {listeners}</p>
            <p>Tag: {tag}</p>
            <p>Artist Id: {artistId}</p>
            </Stack>
            <Button onClick={() => recommendation1() } style={{ left: '50%', transform: 'translateX(-50%)' }}>
                Recommendation 1
            </Button>
            <p>Recommendation 1: <NavLink to={`/song/${recommendation1Data.track_id}`}>{recommendation1Data.track_name}</NavLink></p>
            
            <Button onClick={() => recommendation2() } style={{ left: '50%', transform: 'translateX(-50%)' }}>
                Recommendation 2
            </Button>
            <p>Recommendation 2: <NavLink to={`/song/${recommendation2Data.track_id}`}>{recommendation2Data.track_name}</NavLink></p>
            {/* <p>Recommendation2.2: <NavLink to={`/song/${recommendation2Data[1].track_id}`}>{recommendation2Data[1].track_id}</NavLink></p> */}

        </Container>
    );
}