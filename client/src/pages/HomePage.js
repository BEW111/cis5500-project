import { Container } from '@mui/material';
import { Link } from 'react-router-dom';

export default function HomePage() {
  return (
    <Container>
      <h1>Welcome to MusicMap</h1>
      <p>
        Explore the world of music through our interactive map. Click 
        <Link to="/map"> here </Link>
        to start your journey.
      </p>
    </Container>
  );
};