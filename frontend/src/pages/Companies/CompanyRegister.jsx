import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { registerUser } from "../../services/authService";

import Input from "../../components/Input";
import Button from "../../components/Button";

import "../../styles/CompanyCSS/CompanyRegister.css";

function CompanyRegister() {
  const navigate = useNavigate();

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    role: "Company",
  });

  const handleChange = (e) => {
    setRegisterData({
      ...registerData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const result = await registerUser(registerData);

      alert(result.message);

      if (result.success) {
        navigate("/login", {
          state: {
            email: registerData.email.trim().toLowerCase(),
            role: result.role,
          },
        });
      }
    } catch (error) {
      alert(error.message || "Registration Failed");
    }
  };

  return (
    <div className="company-register-container">
      <div className="company-register-card">
        <p className="company-eyebrow">Company Registration</p>

        <h1>Create your company account</h1>

        <p className="company-subtitle">Build your hiring workspace.</p>

        <form onSubmit={handleSubmit}>
          <Input
            name="name"
            placeholder="Company Name"
            value={registerData.name}
            onChange={handleChange}
          />

          <Input
            type="email"
            name="email"
            placeholder="Company Email"
            value={registerData.email}
            onChange={handleChange}
          />

          <Input
            type="password"
            name="password"
            placeholder="Create Password"
            value={registerData.password}
            onChange={handleChange}
          />

          <Button text="Register Company" />
        </form>

        <div className="company-login-link">
          Already registered?
          <Link to="/login"> Login</Link>
        </div>

        <div className="company-registration-switch">
          Looking for work?{" "}
          <Link to="/register/candidate">Register as Candidate</Link>
        </div>
      </div>
    </div>
  );
}

export default CompanyRegister;
