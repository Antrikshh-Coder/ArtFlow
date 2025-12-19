import { useMemo, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function VerifyEmail() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyEmail, resendVerification } = useAuth();

  const initialEmail = useMemo(() => {
    const fromState = location.state?.email;
    const fromStorage = localStorage.getItem("pendingVerificationEmail");
    return fromState || fromStorage || "";
  }, [location.state]);

  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!email.trim() || !otp.trim()) return;

    setLoading(true);
    try {
      await verifyEmail({ email: email.trim(), otp: otp.trim() });
      localStorage.removeItem("pendingVerificationEmail");
      navigate("/dashboard", { state: { welcomeMode: "login" } });
    } catch (err) {
      alert(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  const resend = async () => {
    if (!email.trim()) return;

    setLoading(true);
    try {
      await resendVerification({ email: email.trim() });
      alert("Verification code sent.");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to resend code");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="page auth">
      <div className="auth-card">
        <h1>Verify Email</h1>

        <input
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          placeholder="6-digit code"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
        />

        <button onClick={submit} disabled={loading}>
          {loading ? "Verifying..." : "Verify"}
        </button>

        <button onClick={resend} disabled={loading}>
          {loading ? "Sending..." : "Resend code"}
        </button>

        <small>
          Back to <Link to="/login">Login</Link>
        </small>
      </div>
    </section>
  );
}
