import { Redirect } from "wouter";

export default function HomePage() {
  // Redirect to the dashboard page
  return <Redirect to="/dashboard" />;
}
