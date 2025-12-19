import { createContext, useContext, useEffect, useState } from "react";
import API from "../api/api";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("user");
    return storedUser ? JSON.parse(storedUser) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  /* =========================
     Attach JWT to Axios
  ========================= */
  useEffect(() => {
    if (token) {
      API.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${token}`;
    } else {
      delete API.defaults.headers.common["Authorization"];
    }
  }, [token]);

  /* =========================
     LOGIN
  ========================= */
  const login = async (data) => {
    try {
      const res = await API.post("/login", data);

      if (res.data?.requiresEmailVerification) {
        const email = res.data?.email || data?.email;
        if (email) {
          localStorage.setItem("pendingVerificationEmail", email);
        }
        const err = new Error(res.data?.message || "Email verification required");
        err.requiresEmailVerification = true;
        err.email = email;
        throw err;
      }

      if (!res.data?.token || !res.data?.user) {
        throw new Error("Invalid login response");
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem(
        "user",
        JSON.stringify(res.data.user)
      );

      setUser(res.data.user);
      setToken(res.data.token);

      return res.data.user;
    } catch (error) {
      const requiresEmailVerification = error?.response?.data?.requiresEmailVerification;
      if (requiresEmailVerification) {
        const email = error?.response?.data?.email || data?.email;
        if (email) {
          localStorage.setItem("pendingVerificationEmail", email);
        }
        const err = new Error(
          error?.response?.data?.message || "Email verification required"
        );
        err.requiresEmailVerification = true;
        err.email = email;
        throw err;
      }
      throw error;
    }
  };

  /* =========================
     REGISTER
  ========================= */
  const register = async (data) => {
    try {
      const res = await API.post("/register", data);

      if (res.data?.requiresEmailVerification) {
        const email = res.data?.user?.email || data?.email;
        if (email) {
          localStorage.setItem("pendingVerificationEmail", email);
        }
        return { requiresEmailVerification: true, email };
      }

      if (!res.data?.token || !res.data?.user) {
        throw new Error("Invalid registration response");
      }

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setUser(res.data.user);
      setToken(res.data.token);

      return res.data.user;
    } catch (error) {
      throw error;
    }
  };

  const verifyEmail = async (data) => {
    const res = await API.post("/verify-email", data);
    if (!res.data?.token || !res.data?.user) {
      throw new Error("Invalid verify response");
    }

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    setUser(res.data.user);
    setToken(res.data.token);

    return res.data.user;
  };

  const resendVerification = async (data) => {
    const res = await API.post("/resend-verification", data);
    return res.data;
  };

  const googleLogin = async ({ credential }) => {
    const res = await API.post("/google-login", { credential });
    if (!res.data?.token || !res.data?.user) {
      throw new Error("Invalid Google login response");
    }

    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));

    setUser(res.data.user);
    setToken(res.data.token);

    return res.data.user;
  };

  /* =========================
     LOGOUT
  ========================= */
  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setToken(null);
    delete API.defaults.headers.common["Authorization"];
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        verifyEmail,
        resendVerification,
        googleLogin,
        logout,
        isAuthenticated: !!token,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }
  return context;
};
