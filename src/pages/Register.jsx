import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import "./Register.css";

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setLoading(true);
    try {
      const result = await register(form); // success = no error thrown
      if (result?.requiresEmailVerification) {
        navigate("/verify-email", { state: { email: result.email } });
        return;
      }
      navigate("/dashboard", { state: { welcomeMode: "registered" } }); // redirect ONLY after success
    } catch (err) {
      alert(
        err.response?.data?.message ||
        "Registration failed! Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page auth">
      <div className="auth-card">
        <h1>Register</h1>

        <input
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <button onClick={submit} disabled={loading}>
          {loading ? "Creating account..." : "Register"}
        </button>

        <small>
          Already have an account? <Link to="/login">Login</Link>
        </small>
      </div>
    </section>
  );
}
