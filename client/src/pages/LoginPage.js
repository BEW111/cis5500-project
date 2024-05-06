import {
  Button,
  TextField,
  Box,
  Container,
  Paper,
  Typography,
} from "@mui/material";
import React, { useState, useContext, useEffect } from "react";
import { UserContext, BACKENDURL } from "../App";

export default function LoginPage() {
  const { user, setUser } = useContext(UserContext);
  const [showSignUp, setShowSignUp] = useState(false);
  const [showSignIn, setShowSignIn] = useState(false);

  useEffect(() => {
    // Reset the user value if it is set (Log Out Functionality)
    if (user) {
      setUser(null);
    }
  }, []);

  return (
    <Container component="main" maxWidth="xs">
      <Paper
        elevation={3}
        sx={{
          mt: 8,
          p: 4,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
        }}
      >
        <Typography component="h1" variant="h5" sx={{ mt: 2 }}>
          Welcome
        </Typography>

        {!showSignUp && !showSignIn && (
          <Box sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              onClick={() => {
                setShowSignUp(true);
                setShowSignIn(false);
              }}
            >
              Sign Up
            </Button>
            <Button
              variant="outlined"
              color="primary"
              fullWidth
              onClick={() => {
                setShowSignIn(true);
                setShowSignUp(false);
              }}
              sx={{ mt: 2 }}
            >
              Sign In
            </Button>
          </Box>
        )}

        {showSignUp && (
          <React.Fragment>
            <Typography
              component="h1"
              variant="h5"
              align="center"
              sx={{ mt: 2, mb: 2 }}
            >
              Sign Up
            </Typography>
            <form action={`${BACKENDURL}/signup`} method="post">
              <Box marginBottom={2}>
                <TextField
                  id="username"
                  name="username"
                  type="text"
                  label="Username"
                  autoComplete="username"
                  required
                  autoFocus
                  fullWidth
                />
              </Box>
              <Box marginBottom={2}>
                <TextField
                  id="password"
                  name="password"
                  type="password"
                  label="Password"
                  autoComplete="new-password"
                  required
                  fullWidth
                />
              </Box>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
              >
                Sign Up
              </Button>
              <Button
                type="button"
                variant="text"
                color="secondary"
                fullWidth
                onClick={() => setShowSignUp(false)}
                sx={{ mt: 1 }}
              >
                Cancel
              </Button>
            </form>
          </React.Fragment>
        )}

        {showSignIn && (
          <React.Fragment>
            <Typography
              component="h1"
              variant="h5"
              align="center"
              sx={{ mt: 2, mb: 2 }}
            >
              Sign In
            </Typography>
            <form action={`${BACKENDURL}/login/password`} method="post">
              <Box marginBottom={2}>
                <TextField
                  id="username-login"
                  name="username"
                  type="text"
                  label="Username"
                  autoComplete="username"
                  required
                  autoFocus
                  fullWidth
                />
              </Box>
              <Box marginBottom={2}>
                <TextField
                  id="current-password"
                  name="password"
                  type="password"
                  label="Password"
                  autoComplete="current-password"
                  required
                  fullWidth
                />
              </Box>
              <Button
                type="submit"
                variant="contained"
                color="primary"
                fullWidth
              >
                Sign in
              </Button>
              <Button
                type="button"
                variant="text"
                color="secondary"
                fullWidth
                onClick={() => setShowSignIn(false)}
                sx={{ mt: 1 }}
              >
                Cancel
              </Button>
            </form>
          </React.Fragment>
        )}

        <Box sx={{ mt: 2, width: "100%" }}>
          <Typography
            component="h1"
            variant="h6"
            align="center"
            sx={{ mt: 4, mb: 2 }}
          >
            Login with Google or Spotify
          </Typography>
          <Button
            variant="outlined"
            href={`${BACKENDURL}/login/federated/google`}
            fullWidth
            sx={{ mb: 1 }}
          >
            Log In with Google
          </Button>
          <Button
            variant="outlined"
            href={`${BACKENDURL}/auth/spotify`}
            fullWidth
          >
            Log In with Spotify
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
