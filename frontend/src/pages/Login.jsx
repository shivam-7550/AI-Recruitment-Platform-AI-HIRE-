import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

import { loginUser } from "../services/authService";

import Input from "../components/Input";
import Button from "../components/Button";

import "../styles/login.css";

function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [loginData, setLoginData] = useState({
    email: location.state?.email || "",
    password: "",
  });

  const handleChange = (e) => {
    setLoginData({
      ...loginData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const result = await loginUser(loginData);

      if (result.success) {
        sessionStorage.setItem("user", JSON.stringify(result));
        localStorage.removeItem("user");

        alert(result.message);

        const dashboardRoutes = {
          User: "/user/dashboard",
          Company: "/company/dashboard",
          Admin: "/admin/dashboard",
        };
        const requestedRoute =
          location.state?.from?.pathname ||
          sessionStorage.getItem("hireline-return-to");
        sessionStorage.removeItem("hireline-return-to");
        const rolePrefix =
          result.role === "User" ? "/user/" : `/${result.role.toLowerCase()}/`;
        navigate(
          requestedRoute?.startsWith(rolePrefix)
            ? requestedRoute
            : dashboardRoutes[result.role] || "/jobs",
          { replace: true },
        );
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error(error);
      alert(error.message || "Login Failed");
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <p className="eyebrow">Secure access</p>
        <h1>Welcome back</h1>

        <p>Your account role is detected automatically.</p>

        {location.state?.role && (
          <p>
            Registration successful as{" "}
            {location.state.role === "User" ? "User" : location.state.role}.
            Enter your password to log in.
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <Input
            type="email"
            name="email"
            placeholder="Enter Email"
            value={loginData.email}
            onChange={handleChange}
          />

          <Input
            type="password"
            name="password"
            placeholder="Enter Password"
            value={loginData.password}
            onChange={handleChange}
          />

          <Button text="Login" />
        </form>

        <div className="register-link">
          New to the platform?
          <Link to="/register/candidate"> User</Link>
          <span> or </span>
          <Link to="/register/company">Company</Link>
        </div>
      </div>
    </div>
  );
}

export default Login;
