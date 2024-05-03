import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Button, Stack} from '@mui/material';
import { NavLink } from 'react-router-dom';

const config = require('../config.json');



export default function SongInfoPage() {
    const { id } = useParams();
    const [artistId, setArtistId] = useState('');
    const [nextTrackId, setNextTrackId] = useState('');
    const [country, setCountry] = useState('');
    const [tag, setTag] = useState('');
    const [listeners, setListeners] = useState('');
    const [songData, setSongData] = useState({});
    const [recommendation1Data, setRecommendation1Data] = useState({})
    const [recommendation2Data, setRecommendation2Data] = useState({})


    useEffect(() => {   
        fetch(`http://${config.server_host}:${config.server_port}/song/${id}`)
          .then(res => res.json())
          .then(
            resJson => {
                const songReturn = resJson;
                setSongData(songReturn);
                setNextTrackId(songReturn.track_id);
                setArtistId(songReturn.artist_id);
                setTag(songReturn.tag);
                setCountry(songReturn.country);
                setListeners(songReturn.listeners)
            } 
        );
      }, [id]);

    const recommendation1 = () => {
        fetch(`http://${config.server_host}:${config.server_port}/recommendation1/${artistId}/${country}/${tag}/${listeners}`)
          .then(res => res.json())
          .then(resJson => setRecommendation1Data(resJson));
    }

    const recommendation2 = () => {
        fetch(`http://${config.server_host}:${config.server_port}/recommendation2/${nextTrackId}`)
          .then(res => res.json())
          .then(resJson => setRecommendation2Data(resJson));
    }

    return (
        <Container>
            <Stack>
            <h1 style={{ fontSize: 64 }}>{songData.track_name}</h1>
            <h2>Background Info:</h2>
            <p>Album: {songData.album_name}</p>
            <p>Artist: {songData.artist_name}</p>
            <p>Artist ID: {artistId}</p>
            <p>Country: {country}</p>
            <p>Listeners: {listeners}</p>
            <p>Current Track Id: {id}</p>
            <p>Next Track Id: {nextTrackId}</p>
            <p>Tag: {tag}</p>
            {/* <p>Duration: {songData.duration / 60}</p> */}
            </Stack>
            <Button onClick={() => recommendation1() } style={{ left: '50%', transform: 'translateX(-50%)' }}>
                Recommendation 1
            </Button>
            <p>Recommendation1: <NavLink to={`/song/${recommendation1Data.track_id}`}>{recommendation1Data.track_name}</NavLink></p>
            
            <Button onClick={() => recommendation2() } style={{ left: '50%', transform: 'translateX(-50%)' }}>
                Recommendation 2
            </Button>
            <p>Recommendation2.1: <NavLink to={`/song/${recommendation2Data.track_id}`}>{recommendation2Data.track_id}</NavLink></p>
            {/* <p>Recommendation2.2: <NavLink to={`/song/${recommendation2Data[1].track_id}`}>{recommendation2Data[1].track_id}</NavLink></p> */}

        </Container>
    );
}