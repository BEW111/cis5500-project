import React from "react";

import { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import {
  Container,
  Button,
  Stack,
  Typography,
  IconButton,
  Box,
  List,
  ListItem,
  Checkbox,
  ListItemText,
  ListItemButton,
  ListItemIcon,
} from "@mui/material";
import { NavLink } from "react-router-dom";
import PlaylistAddIcon from "@mui/icons-material/PlaylistAdd";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { UserContext } from "../App";

const config = require("../config.json");
const BACKENDURL = config.BACKEND_URL
  ? config.BACKEND_URL
  : "http://localhost:8080";

const addToPlaylist = async (playlist_id, track_id) => {
  const postData = { playlist_id: playlist_id, track_id: track_id };
  fetch(`${BACKENDURL}/user/playlists/song`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(postData),
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error("Network response was not ok");
      }
      return response.json();
    })
    .then((data) => {
      console.log("Success:", data);
      //   onSuccess(); // Trigger the callback after successful creation
    })
    .catch((error) => {
      console.error("Error:", error);
    });
};

export default function SongInfoPage() {
  const { id } = useParams();
  const [trackName, setTrackName] = useState("N/A");
  const [albumName, setAlbumName] = useState("N/A");
  const [artistId, setArtistId] = useState("N/A");
  const [country, setCountry] = useState("N/A");
  const [tag, setTag] = useState("N/A");
  const [listeners, setListeners] = useState("N/A");
  const [artistName, setArtistName] = useState("N/A");
  const [recommendation1Data, setRecommendation1Data] = useState({});
  const [recommendation2Data, setRecommendation2Data] = useState({});
  const [recommendation3Data, setRecommendation3Data] = useState({});
  const [rec3Iterations, setRec3Iterations] = useState(0);

  const { user } = useContext(UserContext);
  const [playlists, setPlaylists] = useState();

  const updatePlaylists = async () => {
    if (user != null) {
      const res = await fetch(
        `${BACKENDURL}/user/playlists?user_id=${user.id}`
      );
      const data = await res.json();
      console.log(data);
      setPlaylists(data);
    }
  };
  useEffect(() => {
    updatePlaylists();
  }, []);

  const [checked, setChecked] = React.useState([]);
  const handleToggle = (value) => () => {
    const currentIndex = checked.indexOf(value);
    const newChecked = [...checked];

    if (currentIndex === -1) {
      newChecked.push(value);
    } else {
      newChecked.splice(currentIndex, 1);
    }

    setChecked(newChecked);
  };

  const [openWindow, setOpenWindow] = React.useState(false);
  const handleClickOpenWindow = () => {
    setOpenWindow(true);
  };
  const handleCloseWindowAndSubmit = () => {
    checked.forEach((playlist_id) => addToPlaylist(playlist_id, id));
    setOpenWindow(false);
  };
  const handleCloseWindow = () => {
    setOpenWindow(false);
  };

  useEffect(() => {
    fetch(`${BACKENDURL}/getSongInfo/${id}`)
      .then((res) => res.json())
      .then((resJson) => {
        const songReturn = resJson;
        setTrackName(songReturn.track_name);
        setAlbumName(songReturn.album_name);
        setArtistId(songReturn.artist_id);
      });
  }, [id]);

  useEffect(() => {
    fetch(`${BACKENDURL}/getArtistInfo/${artistId}`)
      .then((res) => res.json())
      .then((resJson) => {
        const songReturn = resJson;
        setArtistName(songReturn.artist_name);
        setCountry(songReturn.country);
        setListeners(songReturn.listeners);
      });
  }, [artistId]);

  useEffect(() => {
    fetch(`${BACKENDURL}/getArtistTags/${artistId}`)
      .then((res) => res.json())
      .then((resJson) => {
        const songReturn = resJson;
        setTag(songReturn.tag);
      });
  }, [artistName]);

  const recommendation1 = () => {
    fetch(
      `${BACKENDURL}/recommendation1/${artistId}/${country}/${tag}/${listeners}`
    )
      .then((res) => res.json())
      .then((resJson) => setRecommendation1Data(resJson));
  };

  const recommendation2 = () => {
    fetch(`${BACKENDURL}/recommendation2/${id}`)
      .then((res) => res.json())
      .then((resJson) => setRecommendation2Data(resJson));
  };

  const recommendation3 = () => {
    fetch(
      `${BACKENDURL}/recommendation3/${artistId}/${country}/${tag}/${listeners}/${rec3Iterations}/${id}`
    )
      .then((res) => res.json())
      .then((resJson) => {
        setRec3Iterations(rec3Iterations + 1);
        setRecommendation3Data(resJson);
      });
  };

  console.log(playlists);

  return (
    <>
      <Dialog open={openWindow} onClose={handleCloseWindow}>
        <DialogTitle>{"Add to playlist"}</DialogTitle>
        <DialogContent>
          <List
            sx={{ width: "100%", maxWidth: 360, bgcolor: "background.paper" }}
          >
            {playlists &&
              playlists.map((playlist) => {
                const labelId = `checkbox-list-label-${playlist.uplaylist_id}`;

                return (
                  <ListItem key={playlist.uplaylist_id} disablePadding>
                    <ListItemButton
                      role={undefined}
                      onClick={handleToggle(playlist.uplaylist_id)}
                      dense
                    >
                      <ListItemIcon>
                        <Checkbox
                          edge="start"
                          checked={
                            checked.indexOf(playlist.uplaylist_id) !== -1
                          }
                          tabIndex={-1}
                          disableRipple
                          inputProps={{ "aria-labelledby": labelId }}
                        />
                      </ListItemIcon>
                      <ListItemText id={labelId} primary={playlist.name} />
                    </ListItemButton>
                  </ListItem>
                );
              })}
          </List>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseWindow}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCloseWindowAndSubmit}
            autoFocus
          >
            Add
          </Button>
        </DialogActions>
      </Dialog>
      <Container>
        <Stack>
          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Typography sx={{ mt: 4 }} variant="h2">
              {trackName}
            </Typography>
            <Box sx={{ p: 4 }}>
              <IconButton
                aria-label="edit"
                size="large"
                onClick={handleClickOpenWindow}
              >
                <PlaylistAddIcon sx={{ fontSize: 58 }} />
              </IconButton>
            </Box>
          </Box>

          <h2>Background Info:</h2>
          <p>Album: {albumName}</p>
          <p>Artist: {artistName}</p>
          <p>Country: {country}</p>
          <p>Listeners: {listeners}</p>
          <p>Tag: {tag}</p>
          {/* <p>Duration: {songData.duration / 60}</p> */}
        </Stack>
        {artistName !== "N/A" && (
          <>
            <Button
              onClick={() => recommendation1()}
              style={{ left: "50%", transform: "translateX(-50%)" }}
            >
              Recommendation 1
            </Button>
            <p>
              Recommendation1:{" "}
              <NavLink to={`/song/${recommendation1Data.track_id}`}>
                {recommendation1Data.track_name}
              </NavLink>
            </p>

            <Button
              onClick={() => recommendation2()}
              style={{ left: "50%", transform: "translateX(-50%)" }}
            >
              Recommendation 2
            </Button>
            <p>
              Recommendation2:{" "}
              <NavLink to={`/song/${recommendation2Data.track_id}`}>
                {recommendation2Data.track_name}
              </NavLink>
            </p>

            <Button
              onClick={() => recommendation3()}
              style={{ left: "50%", transform: "translateX(-50%)" }}
            >
              Recommendation 3
            </Button>
            <p>
              Recommendation3:{" "}
              <NavLink to={`/song/${recommendation3Data.track_id}`}>
                {recommendation3Data.track_name}
              </NavLink>
            </p>
          </>
        )}
      </Container>
    </>
  );
}
