import React from "react";
import { useEffect, useState, useContext, useCallback } from "react";
import { UserContext } from "../App";

import {
  Avatar,
  Box,
  Container,
  Typography,
  Card,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Button,
  IconButton,
  TextField,
} from "@mui/material";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import EditIcon from "@mui/icons-material/Edit";
import { NavLink } from "react-router-dom";

const config = require("../config.json");
const BACKENDURL = config.BACKEND_URL
  ? config.BACKEND_URL
  : "http://localhost:8080";
interface Playlist {
  uplaylist_id: number;
  name: string;
  uid: number;
}

interface Track {
  track_id: number;
  track_name: string;
  track_uri: string;
  duration: number;
}

const createPlaylist = (uid: number, onSuccess: () => void) => {
  const postData = { user_id: uid };

  fetch(`${BACKENDURL}/user/playlists/create`, {
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
      onSuccess(); // Trigger the callback after successful creation
    })
    .catch((error) => {
      console.error("Error:", error);
    });
};

const getPlaylistTracks = async (playlist_id: number) => {
  const res = await fetch(`${BACKENDURL}/user/playlists/${playlist_id}`);
  const data = await res.json();
  return data;
};

const renamePlaylist = async (playlist_id: number, new_name: string) => {
  const postData = { playlist_id: playlist_id, name: new_name };

  fetch(`${BACKENDURL}/user/playlists/rename`, {
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

const PlaylistCard = ({ playlist }: { playlist: Playlist }) => {
  const [tracks, setTracks] = useState<Track[]>([]);

  const [openRename, setOpenRename] = React.useState(false);
  const [name, setName] = useState(playlist.name);
  const [newName, setNewName] = useState(playlist.name);

  const handleClickOpenWindow = () => {
    setOpenRename(true);
  };
  const handleCloseWindowAndSubmit = () => {
    renamePlaylist(playlist.uplaylist_id, name);
    setNewName(name);
    setOpenRename(false);
  };
  const handleCloseWindow = () => {
    setOpenRename(false);
  };

  useEffect(() => {
    getPlaylistTracks(playlist.uplaylist_id).then((t) => {
      console.log(t);
      setTracks(t);
    });
  }, []);

  return (
    <>
      <Dialog open={openRename} onClose={handleCloseWindow}>
        <DialogTitle>{"Rename playlist"}</DialogTitle>
        <DialogContent>
          <TextField
            value={name}
            label="Name"
            sx={{ width: 560 }}
            onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
              setName(event.target.value);
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseWindow}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCloseWindowAndSubmit}
            autoFocus
          >
            Rename
          </Button>
        </DialogActions>
      </Dialog>
      <Card>
        <Box sx={{ p: 2, display: "flex", justifyContent: "space-between" }}>
          <Box>
            <Typography variant="h5">{newName}</Typography>
            <Typography variant="subtitle1">
              {tracks.length} songs •{" "}
              {Math.ceil(
                tracks.map((t) => t.duration).reduce((pSum, d) => pSum + d, 0) /
                  60000
              )}{" "}
              minutes
            </Typography>
          </Box>
          <Box>
            <IconButton aria-label="edit" onClick={handleClickOpenWindow}>
              <EditIcon />
            </IconButton>
          </Box>
        </Box>
        <Divider />
        <List>
          {tracks.map((track) => (
            <ListItem disablePadding>
              <ListItemButton>
                {/* <ListItemText primary={track.track_name} /> */}
                <NavLink to={`/song/${track.track_id}`}>
                  {track.track_name}
                </NavLink>
              </ListItemButton>
            </ListItem>
          ))}
        </List>
      </Card>
    </>
  );
};

export default function UserProfilePage() {
  const { user } = useContext(UserContext);
  //   const [playlists, fetchPlaylists] = usePlaylists(user.id);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [refreshing, setRefreshing] = useState(true);

  const getPlaylists = useCallback(async () => {
    const res = await fetch(`${BACKENDURL}/user/playlists?user_id=${user.id}`);
    const data = await res.json();
    setPlaylists(data);
  }, [user.id]);

  useEffect(() => {
    if (refreshing) {
      console.log("refreshing!!");
      getPlaylists().then(() => setRefreshing(false));
    }
  }, [refreshing, getPlaylists]);

  return (
    <Container sx={{ pt: 4, display: "flex" }}>
      <Box sx={{ flex: 1 }}>
        <Avatar sx={{ width: 96, height: 96 }}>
          <Typography variant="h3">
            {user.name
              .split(" ")
              .map((s) => (s.length > 0 ? s.slice(0, 1) : ""))
              .join("")}
          </Typography>
        </Avatar>
        <Typography variant="h6" sx={{ mt: 2 }}>
          {user.name}
        </Typography>
      </Box>{" "}
      <Box sx={{ flex: 3 }}>
        <Typography variant="h2" sx={{ mb: 2 }}>
          My Playlists
        </Typography>
        <Button
          variant="contained"
          sx={{ mb: 2 }}
          onClick={() => {
            createPlaylist(user.id, () => setRefreshing(true));
          }}
        >
          New Playlist
        </Button>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          {playlists &&
            playlists.length > 0 &&
            playlists.map((playlist) => (
              <PlaylistCard key={playlist.uplaylist_id} playlist={playlist} />
            ))}
        </Box>
      </Box>
    </Container>
  );
}
