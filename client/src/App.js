import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { CssBaseline, ThemeProvider } from '@mui/material'
import { indigo, amber } from '@mui/material/colors'
import { createTheme } from "@mui/material/styles";

import NavBar from './components/NavBar';
import HomePage from './pages/HomePage';
import AlbumsPage from './pages/AlbumsPage';
import SongsPage from './pages/SongsPage';
import AlbumInfoPage from './pages/AlbumInfoPage'
import LoginPage from './pages/LoginPage';

import MapPage from "./pages/MapPage";

export const theme = createTheme({
  palette: {
    primary: indigo,
    secondary: amber,
  },
});

export const UserContext = React.createContext();

function PrivateRoute({ element, ...rest }) {
  const { user } = useContext(UserContext);

  return user ? (
    <Route element={element} {...rest} />
  ) : (
    <Navigate to="/login" />
  );
}

export default function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    // Fetch the user's data when the app loads
    const urlParams = new URLSearchParams(window.location.search);
    const user_ = JSON.parse(urlParams.get('user'));
    if (user_) {
      setUser(user_);
      console.log(user_);
    }
    
  }, []);

  console.log(user);

  

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <UserContext.Provider value={{ user, setUser }}>
        <BrowserRouter>
          <NavBar />
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/albums" element={<AlbumsPage />} />
            <Route path="/albums/:album_id" element={<AlbumInfoPage />} />
            <Route path="/songs"  element={user ? <SongsPage /> : <Navigate to="/login" replace />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/map" element={user ? <MapPage /> : <Navigate to="/login" replace />} />
          </Routes>
        </BrowserRouter>
      </UserContext.Provider>
    </ThemeProvider>
  );
}
