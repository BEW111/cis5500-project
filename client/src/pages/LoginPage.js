import { Button } from '@mui/material';

export default function LoginPage() {
  return (
    <div>
      <h1>Login</h1>
      <Button href="http://localhost:8080/login/federated/google">Log In with Google</Button>
      <Button href="/auth/facebook">Log In with Facebook</Button>
    </div>
  );
}