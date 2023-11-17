import React, { useRef } from "react";
import "./register.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
function Register() {
  const username = useRef();
  const email = useRef();
  const password = useRef();
  const passwordAgain = useRef();

  const navigate = useNavigate();
  const handleClick = async (e) => {
    e.preventDefault();
    if (passwordAgain.current.value !== password.current.value) {
      passwordAgain.current.setCustomValidity("Passwords dont match!");
    } else {
      const user = {
        username: username.current.value,
        email: email.current.value,
        password: password.current.value,
      };
      try {
        await axios.post("auth/register", user);

        navigate("/login");
      } catch (error) {
        console.log(error);
      }
    }
  };
  return (
    <div className="register">
      <div className="registerWrapper">
        <div className="registerLeft">
          <h3 className="regiserLogo">Narensocial</h3>
          <span className="regiserDesc">
            Connect with friends and the world around you on Narensocial.
          </span>
        </div>
        <div className="registerRight">
          <form className="registerBox" onSubmit={handleClick}>
            <input
              type="text"
              placeholder="Username"
              className="registerInput"
              ref={username}
            />
            <input
              type="email"
              placeholder="email"
              className="registerInput"
              ref={email}
            />
            <input
              type="password"
              placeholder="password"
              className="registerInput"
              ref={password}
            />
            <input
              type="password"
              placeholder="password again"
              className="registerInput"
              ref={passwordAgain}
            />
            <button className="loginButton1">Sign Up</button>
            <button className="loginButton2">Log into Account</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
