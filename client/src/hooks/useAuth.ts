import { useState } from "react";

// Simple mock authentication for demonstration
// In production, this would integrate with a real auth provider
export function useAuth() {
  // Mock authentication state - can be replaced with real auth later
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading] = useState(false);
  
  // Mock user data
  const user = isAuthenticated ? { 
    id: "1", 
    email: "admin@example.com", 
    name: "Admin User" 
  } : null;

  const login = () => setIsAuthenticated(true);
  const logout = () => setIsAuthenticated(false);

  return {
    user,
    isLoading,
    isAuthenticated,
    login,
    logout,
  };
}