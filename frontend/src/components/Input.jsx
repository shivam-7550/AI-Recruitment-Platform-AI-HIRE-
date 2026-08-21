import { useState } from "react";
import "./../styles/input.css";

function Input({ type = "text", name, placeholder, value, onChange }) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";

  return (
    <div className={`input-group ${isPassword ? "password-group" : ""}`}>
      <input
        className="input-field"
        type={isPassword && showPassword ? "text" : type}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required
      />
      {isPassword && (
        <button
          className="password-toggle"
          type="button"
          onClick={() => setShowPassword((visible) => !visible)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
        >
          {showPassword ? (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 3l18 18M10.6 10.7a2 2 0 002.7 2.7M9.9 4.3A10.8 10.8 0 0112 4c5.5 0 9 5.5 9 5.5a16 16 0 01-2.1 2.7M6.6 6.6C4.3 8 3 9.5 3 9.5S6.5 15 12 15a9.7 9.7 0 003.4-.6" />
            </svg>
          ) : (
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M3 12s3.5-5.5 9-5.5S21 12 21 12s-3.5 5.5-9 5.5S3 12 3 12z" />
              <circle cx="12" cy="12" r="2.5" />
            </svg>
          )}
        </button>
      )}
    </div>
  );
}

export default Input;
