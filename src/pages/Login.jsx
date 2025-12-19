import { useEffect, useRef, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const { login, googleLogin } = useAuth();
  const navigate = useNavigate();
  const googleBtnRef = useRef(null);

  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      await login(form);       // success = no error thrown
      navigate("/dashboard", { state: { welcomeMode: "login" } }); // redirect ONLY after success
    } catch (err) {
      if (err?.requiresEmailVerification) {
        navigate("/verify-email", { state: { email: err.email || form.email } });
        return;
      }
      alert(
        err.response?.data?.message ||
        "Invalid email or password"
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) return;
    if (!googleBtnRef.current) return;

    const g = window.google;
    if (!g?.accounts?.id) return;

    g.accounts.id.initialize({
      client_id: clientId,
      callback: async (response) => {
        try {
          await googleLogin({ credential: response.credential });
          navigate("/dashboard", { state: { welcomeMode: "login" } });
        } catch (err) {
          alert(err.response?.data?.message || "Google login failed");
        }
      }
    });

    g.accounts.id.renderButton(googleBtnRef.current, {
      theme: "outline",
      size: "large",
      width: 320
    });
  }, [googleLogin, navigate]);

  return (
    <section className="page auth">
      <div className="auth-card">
        <h1>Login</h1>

        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) =>
            setForm({ ...form, password: e.target.value })
          }
        />

        <button onClick={submit} disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>

        <div style={{ marginTop: "12px", display: "flex", justifyContent: "center" }}>
          <div ref={googleBtnRef} />
        </div>

        <small>
          Don’t have an account?{" "}
          <Link to="/register">Register</Link>
        </small>
      </div>
    </section>
  );
}
