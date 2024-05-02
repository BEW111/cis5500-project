import { Button, TextField, Box } from '@mui/material';

export default function LoginPage() {
  return (
    
    <div>
      <h1>Sign Up</h1>
      <form action="http://localhost:8080/signup" method="post"> {/* Update the action URL to match your server */}
        <Box marginBottom={2}>
          <TextField id="username" name="username" type="text" label="Username" autoComplete="username" required autoFocus fullWidth />
        </Box>
        <Box marginBottom={2}>
          <TextField id="password" name="password" type="password" label="Password" autoComplete="new-password" required fullWidth />
        </Box>
        <Button type="submit" variant="contained" color="primary">
          Sign Up
        </Button>
      </form>

      <h1>Sign in</h1>
      <form action="http://localhost:8080/login/password" method="post">
        <Box marginBottom={2}>
          <TextField id="username" name="username" type="text" label="Username" autoComplete="username" required autoFocus fullWidth />
        </Box>
        <Box marginBottom={2}>
          <TextField id="current-password" name="password" type="password" label="Password" autoComplete="current-password" required fullWidth />
        </Box>
        <Button
        type="submit"
        variant="contained"
        color="primary"
        >
  Sign in
</Button>
      </form>
      <div paddingBottom="600px"/>

      <h1>Login with Google or Facebook</h1>
      <Button href="http://localhost:8080/login/federated/google">Log In with Google</Button>
      <Button href="/auth/facebook">Log In with Facebook</Button>

    </div>
  );
}