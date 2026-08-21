import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { registerUser } from "../../services/authService";

import Input from "../../components/Input";
import Button from "../../components/Button";

import "../../styles/CandidatesCSS/CandidateRegister.css";

function CandidateRegister() {
  const navigate = useNavigate();

  const [registerData, setRegisterData] = useState({
    name: "",
    email: "",
    password: "",
    role: "User",
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
    <div className="candidate-register-container">
      <div className="candidate-register-card">
        <p className="candidate-eyebrow">Candidate Registration</p>

        <h1>Create your candidate account</h1>

        <p className="candidate-subtitle">Start your next career move.</p>

        <form onSubmit={handleSubmit}>
          <Input
            name="name"
            placeholder="Enter Full Name"
            value={registerData.name}
            onChange={handleChange}
          />

          <Input
            type="email"
            name="email"
            placeholder="Enter Email"
            value={registerData.email}
            onChange={handleChange}
          />

          <Input
            type="password"
            name="password"
            placeholder="Enter Password"
            value={registerData.password}
            onChange={handleChange}
          />

          <Button text="Register" />
        </form>

        <div className="candidate-login-link">
          Already registered?
          <Link to="/login"> Login</Link>
        </div>

        <div className="candidate-registration-switch">
          Hiring talent?
          <Link to="/register/company">Register as Company</Link>
        </div>
      </div>
    </div>
  );
}

export default CandidateRegister;
