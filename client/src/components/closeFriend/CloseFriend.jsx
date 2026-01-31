import React from "react";
import { Link } from "react-router-dom";
import "./CloseFriend.css";
import BuildImageUrl from "../../utils/BuildImageUrl.jsx";

function CloseFriend({ user, onRemove }) {
  const PF = import.meta.env.VITE_PUBLIC_FOLDER || "/images/";

  return (
    <li
      className="sidebarFriend"
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <Link
        to={"/profile/" + user?.username}
        style={{
          textDecoration: "none",
          color: "inherit",
          display: "flex",
          alignItems: "center",
        }}
      >
        <img
          className="sidebarFriendImg"
          src={
            BuildImageUrl(user?.profilePicture, PF) ||
            PF + "person/noAvatar.png"
          }
          alt=""
        />
        <span className="sidebarFriendName">{user?.username}</span>
      </Link>
      <button
        onClick={(e) => {
          e.preventDefault();
          onRemove(user._id);
        }}
        style={{
          border: "none",
          backgroundColor: "#1877f2",
          color: "white",
          borderRadius: "5px",
          padding: "5px 10px",
          cursor: "pointer",
          fontSize: "12px",
        }}
      >
        Unfriend
      </button>
    </li>
  );
}

export default CloseFriend;
