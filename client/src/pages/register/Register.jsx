import React, { useContext, useRef, useEffect } from "react";
import "./register.css";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import {
  RegisterFailure,
  RegisterStart,
  ResetError,
} from "../../context/AuthActions";
function Register() {
  const username = useRef();
  const email = useRef();
  const password = useRef();
  const passwordAgain = useRef();
  const city = useRef();
  const from = useRef();
  const relationship = useRef();
  const { isFetching, error, dispatch } = useContext(AuthContext);

  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      dispatch(ResetError());
    };
  }, [dispatch]);

  const handleClick = async (e) => {
    e.preventDefault();
    if (passwordAgain.current.value !== password.current.value) {
      passwordAgain.current.setCustomValidity("Passwords don't match!");
      e.target.reportValidity();
    } else {
      passwordAgain.current.setCustomValidity("");
      dispatch(RegisterStart());
      const user = {
        username: username.current.value,
        email: email.current.value,
        password: password.current.value,
        city: city.current.value,
        from: from.current.value,
        relationship: relationship.current.value,
      };
      try {
        await axios.post("/auth/register", user);
        navigate("/login");
      } catch (err) {
        dispatch(
          RegisterFailure(err.response?.data || "Something went wrong!")
        );
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
              placeholder="user name"
              required
              className="registerInput"
              ref={username}
            />
            <input
              type="email"
              placeholder="email"
              required
              className="registerInput"
              ref={email}
            />
            <input
              type="password"
              placeholder="password"
              required
              minLength="6"
              className="registerInput"
              ref={password}
            />
            <input
              type="password"
              placeholder="password again"
              required
              className="registerInput"
              ref={passwordAgain}
            />
            <input placeholder="City" className="registerInput" ref={city} />
            <input placeholder="From" className="registerInput" ref={from} />
            <input
              placeholder="Relationship"
              className="registerInput"
              ref={relationship}
            />
            {error && (
              <span
                style={{ color: "red", textAlign: "center", marginTop: "10px" }}
              >
                {typeof error === "string" ? error : "Something went wrong!"}
              </span>
            )}
            <button
              className="loginButton1"
              type="submit"
              disabled={isFetching}
            >
              {isFetching ? "Loading..." : "Sign Up"}
            </button>

            <span
              className="loginButton2"
              onClick={() => {
                navigate("/login");
              }}
            >
              Login
            </span>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
