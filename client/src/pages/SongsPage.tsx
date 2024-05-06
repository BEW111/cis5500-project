import { useEffect, useState, useMemo } from "react";
import { Box, Button, Card, Container, Link } from "@mui/material";
import { Typography } from "@mui/material";
import { NavLink } from "react-router-dom";

import React from "react";
import TextField from "@mui/material/TextField";
import Autocomplete from "@mui/material/Autocomplete";
import Grid from "@mui/material/Grid";
import { debounce } from "@mui/material/utils";

import { BACKENDURL } from "../App";

interface SongResult {
  id: string;
  track_name: string;
}

export default function SongsPage() {
  // For autocomplete
  const [value, setValue] = useState<string | SongResult | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState<(string | SongResult)[]>([]);

  const [results, setResults] = useState<SongResult[]>([]);

  /* Search stuff */
  const getAutocompleteResults = useMemo(
    () =>
      debounce((input, callback) => {
        fetch(`${BACKENDURL}/search?q=${input}`)
          .then((response) => response.json())
          .then((data) => {
            callback(data);
          })
          .catch((error) => console.error("Error fetching data:", error));
      }, 400),
    []
  );

  const updateSearchResults = () => {
    fetch(`${BACKENDURL}/search?q=${inputValue}`)
      .then((response) => response.json())
      .then((data) => {
        setResults(data);
      })
      .catch((error) => console.error("Error fetching data:", error));
  };

  useEffect(() => {
    let active = true;

    if (inputValue === "") {
      setOptions(value ? [value] : []);
      return;
    }

    getAutocompleteResults(inputValue, (songs: SongResult[]) => {
      if (active) {
        let newOptions: (string | SongResult)[] = [];

        if (value) {
          newOptions = [value];
        }

        if (songs) {
          newOptions = [...newOptions, ...songs];
        }

        setOptions(newOptions);
      }
    });

    return () => {
      active = false;
    };
  }, [value, inputValue, getAutocompleteResults]);

  return (
    <Container>
      <h2>Search Songs</h2>
      <Autocomplete
        id="custom-autocomplete"
        sx={{ width: 500 }}
        getOptionLabel={(option) =>
          typeof option === "string" ? option : option.track_name
        }
        filterOptions={(x) => x}
        options={options}
        freeSolo
        autoComplete
        includeInputInList
        filterSelectedOptions
        value={value}
        onChange={(event, newValue) => {
          setOptions(newValue ? [newValue, ...options] : options);
          setValue(newValue);
        }}
        onInputChange={(event, newInputValue) => {
          setInputValue(newInputValue);
        }}
        renderInput={(params) => (
          <TextField {...params} label="Find a song" fullWidth />
        )}
        renderOption={(props, option) => (
          <li {...props} id={typeof option === "string" ? option : option.id}>
            <Grid container alignItems="center">
              <Typography variant="body1" sx={{ fontWeight: "bold" }}>
                {typeof option === "string" ? option : option.track_name}
              </Typography>
            </Grid>
          </li>
        )}
      />
      <Button variant="contained" sx={{ mt: 2 }} onClick={updateSearchResults}>
        Find songs
      </Button>
      <h2>Results</h2>
      {results.length > 0 ? (
        results.map((song) => (
          <Card sx={{ mb: 2 }}>
            <Box sx={{ p: 2 }}>
              <Typography gutterBottom variant="h5" component="div">
                {song.track_name}
              </Typography>
              <Typography color="text.secondary" variant="body2">
                <NavLink to={`/song/${song.id}`}>{song.track_name}</NavLink>
              </Typography>
            </Box>
          </Card>
        ))
      ) : (
        <Typography>Use the search bar to browse songs!</Typography>
      )}
    </Container>
  );
}
