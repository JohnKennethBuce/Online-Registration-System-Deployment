import LoginForm from '../components/LoginForm'; // <-- Import your existing component

export default function LoginPage() {
  return (
    <div style={{ padding: "20px" }}>
      <h2>Login</h2>
      <LoginForm /> {/* <-- Render your component here */}
    </div>
  );
}