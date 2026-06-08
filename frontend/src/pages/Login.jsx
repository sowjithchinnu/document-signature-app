import { useState } from "react";
import API from "../services/api";

function Login({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [isRegister, setIsRegister] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      if (isRegister) {
        await API.post("/auth/register", {
          name: name || email.split("@")[0],
          email,
          password,
        });

        setMessage("Registration successful. You can now log in.");
        setIsRegister(false);
      } else {
        const res = await API.post("/auth/login", {
          email,
          password,
        });

        if (res.data?.token) {
          onLogin(res.data.token);
        } else {
          setMessage("Login failed. No token returned.");
        }
      }
    } catch (error) {
      setMessage(error?.response?.data?.message || "Request failed. Please try again.");
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: "40px auto", padding: "20px", border: "1px solid #ccc", borderRadius: 8 }}>
      <h1>{isRegister ? "Register" : "Login"}</h1>
      <form onSubmit={handleSubmit}>
        {isRegister && (
          <div style={{ marginBottom: 12 }}>
            <label>
              Name
              <input
                type="text"
                value={name}
                onChange={(event) => setName(event.target.value)}
                style={{ width: "100%", padding: "8px", marginTop: "4px" }}
                placeholder="Your name"
              />
            </label>
          </div>
        )}

        <div style={{ marginBottom: 12 }}>
          <label>
            Email
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
              placeholder="you@example.com"
              required
            />
          </label>
        </div>

        <div style={{ marginBottom: 12 }}>
          <label>
            Password
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              style={{ width: "100%", padding: "8px", marginTop: "4px" }}
              placeholder="Secure password"
              required
            />
          </label>
        </div>

        <button type="submit" style={{ padding: "10px 20px" }}>
          {isRegister ? "Register" : "Login"}
        </button>
      </form>

      <div style={{ marginTop: 16 }}>
        <button
          type="button"
          onClick={() => {
            setIsRegister(!isRegister);
            setMessage("");
          }}
          style={{ padding: "8px 14px" }}
        >
          {isRegister ? "Switch to Login" : "Switch to Register"}
        </button>
      </div>

      {message && <p style={{ marginTop: 16 }}>{message}</p>}
    </div>
  );
}

export default Login;
