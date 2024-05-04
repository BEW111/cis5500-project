import {
  AppBar,
  Container,
  Toolbar,
  Typography,
  Avatar,
  Box,
} from "@mui/material";
import { NavLink } from "react-router-dom";
import React, { useContext } from "react";
import { UserContext } from "../App";

// The hyperlinks in the NavBar contain a lot of repeated formatting code so a
// helper component NavText local to the file is defined to prevent repeated code.
function NavText({ href, text, isMain }) {
  return (
    <Typography
      variant={isMain ? "h5" : "h7"}
      noWrap
      style={{
        marginRight: "30px",
        // fontFamily: 'monospace',
        fontWeight: 700,
        letterSpacing: ".3rem",
      }}
    >
      <NavLink
        to={href}
        style={{
          color: "inherit",
          textDecoration: "none",
        }}
      >
        {text}
      </NavLink>
    </Typography>
  );
}

// Here, we define the NavBar. Note that we heavily leverage MUI components
// to make the component look nice. Feel free to try changing the formatting
// props to how it changes the look of the component.
export default function NavBar() {
  const { user } = useContext(UserContext);
  return (
    <AppBar position="static">
      <Container maxWidth="xl">
        <Toolbar disableGutters>
          <NavText href="/" text="AMPMAP" isMain />
          <NavText href="/albums" text="ALBUMS" />
          <NavText href="/songs" text="SONGS" />
          <NavText href="map" text="MAP" />
          <Box
            sx={{
              flexGrow: 1,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            {user ? (
              <NavLink
                to="/profile"
                style={{
                  color: "inherit",
                  textDecoration: "none",
                }}
              >
                <Avatar>
                  <Typography>
                    {user.name
                      .split(" ")
                      .map((s) => (s.length > 0 ? s.slice(0, 1) : ""))
                      .join("")}
                  </Typography>
                </Avatar>
              </NavLink>
            ) : (
              <NavText href="/login" text={user ? "LOGOUT" : "LOGIN"} />
            )}
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
}
