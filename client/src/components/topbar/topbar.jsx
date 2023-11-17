import React, { useContext, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, Person, Chat, Notifications } from "@material-ui/icons";
import "./topbar.css";
import { AuthContext } from "../../context/AuthContext";

function Topbar() {
  const [toggle, setToggle] = useState(false);
  const { user } = useContext(AuthContext);
  const PF = "http://localhost:3000/images/";
  const navigate = useNavigate();

  const logout = () => {
    localStorage.clear();
    navigate("/login");
  };

  return (
    <div className="topbarContainer">
      <div className="topbarLeft">
        <Link to="/" style={{ textDecoration: "none" }}>
          <span className="logo">Narensocila</span>
        </Link>
      </div>
      <div className="topbarCenter">
        <div className="searchbar">
          <Search className="searchIcon" />
          <input
            placeholder="Search for friend, post or video"
            className="searchInput"
          />
        </div>
      </div>
      <div className="topbarRight">
        <div className="topbarLink">
          <span className="topbarLink">Homepage</span>
          <span className="topbarLink">Timeline</span>
        </div>
        <div className="topbarIcons">
          <div className="topbarIconItem">
            <Person />
            <span className="topbarIconBadge">1</span>
          </div>
          <div className="topbarIconItem">
            <Chat />
            <span className="topbarIconBadge">2</span>
          </div>
          <div className="topbarIconItem">
            <Notifications />
            <span className="topbarIconBadge">1</span>
          </div>
        </div>

        <Link to="/">
          <img
            src={
              user.profilePicture
                ? PF + user.profilePicture
                : PF + "person/noAvatar.png"
            }
            alt=""
            className="topbarImg"
            onFocus={() => setToggle(true)}
          ></img>
          {toggle && (
            <ul>
              <li>hello</li>
              <li>hi</li>
            </ul>
          )}
        </Link>

        <Link onClick={logout} className="logout">
          Logout
        </Link>
      </div>
    </div>
  );
}

export default Topbar;
