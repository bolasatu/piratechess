import React, { useState } from 'react';
import {login} from "../login.ts";

const initialUsername = 'danny@bobmail.info';
const initialPassword = 'junky888';

const Login: React.FC = () => {
  const [username, setUsername] = useState(initialUsername);
  const [password, setPassword] = useState(initialPassword);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    console.log('Login submitted:', { username, password });
    await login(username,password)
    // Add your login logic here
  };

  return (
    <div>
      <h2>Login</h2>
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
    </div>
  );
};

export default Login;