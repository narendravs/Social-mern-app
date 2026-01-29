import React, { useContext, useRef, useEffect, useState } from "react";
import "./register.css";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import {
  RegisterFailure,
  RegisterStart,
  ResetError,
} from "../../context/AuthActions";
import {
  PersonOutline,
  EmailOutlined,
  LockOutlined,
  LocationCityOutlined,
  HomeOutlined,
  FavoriteBorderOutlined,
  Login,
} from "@mui/icons-material";

function Register() {
  const [success, setSuccess] = useState("");
  const username = useRef();
  const email = useRef();
  const password = useRef();
  const passwordAgain = useRef();
  const city = useRef();
  const from = useRef();
  const relationship = useRef();
  const { isFetching, error, dispatch, errorMessage, register } =
    useContext(AuthContext);

  const navigate = useNavigate();

  useEffect(() => {
    return () => {
      dispatch(ResetError());
    };
  }, [dispatch]);

  const handleClick = async (e) => {
    e.preventDefault();
    setSuccess("");
    if (passwordAgain.current.value !== password.current.value) {
      // Still good to keep this for the browser UI popup
      passwordAgain.current.setCustomValidity("Passwords don't match!");
      e.target.reportValidity();

      // 2. Dispatch the error to global state so it displays in your <span> below
      dispatch(RegisterFailure("Passwords do not match!"));
      return; // Stop the function here
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
        const res = await register(user);
        if (res.success) {
          setSuccess("Registration successful! You can now log in.");
          e.target.reset();
          dispatch({ type: "REGISTER_SUCCESS" });
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleInputFocus = () => {
    passwordAgain.current.setCustomValidity("");
    if (error) {
      dispatch(ResetError());
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
            <div className="registerDiv">
              <PersonOutline className="registerIcon" />
              <input
                type="text"
                placeholder="user name"
                required
                className="registerInput"
                ref={username}
              />
            </div>
            <div className="registerDiv">
              <EmailOutlined className="registerIcon" />
              <input
                type="email"
                placeholder="email"
                required
                className="registerInput"
                ref={email}
              />
            </div>
            <div className="registerDiv">
              <LockOutlined className="registerIcon" />
              <input
                type="password"
                placeholder="password"
                required
                minLength="6"
                className="registerInput"
                ref={password}
                onInput={handleInputFocus}
              />
            </div>
            <div className="registerDiv">
              <LockOutlined className="registerIcon" />
              <input
                type="password"
                placeholder="password again"
                required
                className="registerInput"
                ref={passwordAgain}
                onInput={handleInputFocus}
              />
            </div>
            <div className="registerDiv">
              <LocationCityOutlined className="registerIcon" />
              <input placeholder="City" className="registerInput" ref={city} />
            </div>
            <div className="registerDiv">
              <HomeOutlined className="registerIcon" />
              <input placeholder="From" className="registerInput" ref={from} />
            </div>
            <div className="registerDiv">
              <FavoriteBorderOutlined className="registerIcon" />
              <select
                className="registerInput"
                ref={relationship}
                required
                defaultValue=""
              >
                <option value="" disabled>
                  Relationship Status
                </option>
                <option value="Single">Single</option>
                <option value="Married">Married</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="messageContainer">
              {error && (
                <span className="registerError">
                  {errorMessage || "An unexpected error occurred."}
                </span>
              )}
              {success && (
                <div className="registerMsg">
                  <span className="registerSuccess">{success}</span>
                  <span
                    className="loginButton2 navigateMsg"
                    onClick={() => navigate("/login")}
                  >
                    Click here to Login
                  </span>
                </div>
              )}
            </div>
            <button
              className="loginButton1"
              type="submit"
              disabled={isFetching}
            >
              {isFetching ? "Loading..." : "Sign Up"}
            </button>

            <div className="registerContainer">
              <span
                className="loginButton2"
                onClick={() => {
                  navigate("/login");
                }}
              >
                <Login fontSize="small" className="registerinLink" />
                Login
              </span>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default Register;
