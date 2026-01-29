import React, { useContext, useRef, useEffect } from "react";
import "./login.css";
import { AuthContext } from "../../context/AuthContext";
import { CircularProgress } from "@material-ui/core";
import { useNavigate } from "react-router-dom";
import { Email, Lock } from "@material-ui/icons";

function Login() {
  const email = useRef();
  const password = useRef();
  const { isFetching, login, error, errorMessage, clearError } =
    useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    // Clear any old errors when the login page loads
    clearError();
  }, [clearError]);

  const handleClick = async (e) => {
    e.preventDefault();

    try {
      const res = await login(email.current.value, password.current.value);

      if (res.success) {
        navigate("/");
      }
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="login">
      <div className="loginWrapper">
        <div className="loginLeft">
          <h3 className="loginLogo">Narensocial</h3>
          <span className="loginDesc">
            Connect with friends and the world around you on Narensocial.
          </span>
        </div>
        <div className="loginRight">
          <form className="loginBox" onSubmit={handleClick}>
            <div className="loginDiv">
              <Email className="loginIcon" />
              <input
                type="email"
                placeholder="email"
                required
                className="loginInput"
                ref={email}
              />
            </div>
            <div className="loginDiv">
              <Lock className="loginIcon" />
              <input
                type="password"
                placeholder="password"
                required
                className="loginInput"
                minLength="6"
                ref={password}
                onInput={clearError}
              />
            </div>
            <div className="messageContainer">
              {error && <span className="loginError">{errorMessage}</span>}
            </div>
            <button className="loginButton">
              {isFetching ? (
                <CircularProgress color="white" size="20px" />
              ) : (
                "Log In"
              )}
            </button>
            <div className="loginForgotContainer">
              <span className="loginLink" onClick={() => navigate("/register")}>
                Sign up
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Login;
