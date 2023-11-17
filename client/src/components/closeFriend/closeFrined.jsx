import React from "react";
import "./closeFriend.css";

function closeFrined({ user }) {
  const PF = "http://localhost:3000/images/";

  return (
    <li className="sidebarFriend">
      <img className="sidebarFriendImg" src={PF + user.profilePicture} alt="" />
      <span className="sidebarFriendName">{user.username}</span>
    </li>
  );
}

export default closeFrined;
