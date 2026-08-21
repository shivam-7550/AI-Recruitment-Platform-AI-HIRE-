import "../styles/button.css";

function Button({ text, type = "submit", onClick }) {
  return (
    <button className="btn" type={type} onClick={onClick}>
      {text}
    </button>
  );
}

export default Button;
