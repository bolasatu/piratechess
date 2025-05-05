import React, { useState, useEffect } from 'react';
import {login} from "../login.ts";
import { AuthUtils } from '../AuthUtils';

const initialUsername = 'danny@bobmail.info';
const initialPassword = 'junky888';

const Login: React.FC = () => {
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState(initialPassword);
  const [loginStatus, setLoginStatus] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // Check if user is already logged in when component mounts
  useEffect(() => {
    const isUserLoggedIn = AuthUtils.isLoggedIn();
    if (isUserLoggedIn) {
      const userId = AuthUtils.getUserId();
      setIsLoggedIn(true);
      setLoginStatus(`Already logged in. User ID: ${userId}`);
    }
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Login submitted:', { username, password });
    
    try {
      const result = await login(username, password);
      
      if (result) {
        // Login successful
        setIsLoggedIn(true);
        setLoginStatus(`Login successful! User ID: ${result}`);
      } else {
        // No UID returned, but no error either
        setLoginStatus('Login completed but no user ID was returned.');
      }
    } catch (error: any) {
      // Login failed with error
      setLoginStatus(`Login failed: ${error.message || 'Unknown error'}`);
      console.error('Login error:', error);
    }
  };
  return (
    <div>
      <h2>Login</h2>
      {isLoggedIn ? (
        <div>
          <p>You are logged in!</p>
          <p>{loginStatus}</p>
          <button onClick={() => {
            AuthUtils.logout();
            setIsLoggedIn(false);
            setLoginStatus('');
          }}>
            Logout
          </button>
        </div>
      ) : (
        <>
          <form onSubmit={handleSubmit}>
            <div>
              <label htmlFor="username">Username:</label>
              <input
                type="text"
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="password">Password:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit">Login</button>
          </form>
          {loginStatus && <p className="login-status">{loginStatus}</p>}
        </>
      )}
    </div>
  );
};

export default Login;