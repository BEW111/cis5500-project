import { Button, TextField, Box, Container, Paper, Typography } from '@mui/material';

export default function LoginPage() {
  return (
    <Container component="main" maxWidth="xs">
      <Paper elevation={3} sx={{ mt: 8, p: 4 }}>
        <Typography component="h1" variant="h5" align="center" sx={{ mb: 4 }}>
          Sign Up
        </Typography>
        <form action="http://localhost:8080/signup" method="post">
          <Box marginBottom={2}>
            <TextField id="username" name="username" type="text" label="Username" autoComplete="username" required autoFocus fullWidth />
          </Box>
          <Box marginBottom={2}>
            <TextField id="password" name="password" type="password" label="Password" autoComplete="new-password" required fullWidth />
          </Box>
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Sign Up
          </Button>
        </form>

        <Typography component="h1" variant="h5" align="center" sx={{ mt: 4, mb: 4 }}>
          Sign In
        </Typography>
        <form action="http://localhost:8080/login/password" method="post">
          <Box marginBottom={2}>
            <TextField id="username-login" name="username" type="text" label="Username" autoComplete="username" required autoFocus fullWidth />
          </Box>
          <Box marginBottom={2}>
            <TextField id="current-password" name="password" type="password" label="Password" autoComplete="current-password" required fullWidth />
          </Box>
          <Button type="submit" variant="contained" color="primary" fullWidth>
            Sign in
          </Button>
        </form>

        <Typography component="h1" variant="h5" align="center" sx={{ mt: 4, mb: 2 }}>
          Login with Google or Spotify
        </Typography>
        <Box display="flex" justifyContent="space-around">
          <Button href="http://localhost:8080/login/federated/google" variant="outlined">
            Log In with Google
          </Button>
          <Button href="http://localhost:8080/auth/spotify" variant="outlined">
            Log In with Spotify
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
