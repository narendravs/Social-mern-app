import React, { useState, useEffect, useContext } from "react";
import "./Sidebar.css";
import {
  RssFeed,
  Chat,
  PlayCircleFilledOutlined,
  Group,
  Bookmark,
  HelpOutline,
  WorkOutline,
  Event,
  School,
  Add,
} from "@mui/icons-material";
import CloseFriend from "../closeFriend/closeFrined.jsx";
import { userAPI } from "../../lib/api.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import { useSocket } from "../../context/socket/SocketContext.jsx";
import BuildImageUrl from "../../utils/BuildImageUrl.jsx";

function Sidebar() {
  const { user } = useContext(AuthContext);
  const [friends, setFriends] = useState([]);
  const [suggestedUsers, setSuggestedUsers] = useState([]);
  const [visibleCount, setVisibleCount] = useState(5);
  const { socket } = useSocket();
  const PF = import.meta.env.VITE_PUBLIC_FOLDER;

  useEffect(() => {
    const fetchFriends = async () => {
      if (!user?._id && !user?.id) return;
      try {
        const userId = user._id || user.id;
        const res = await userAPI.getFriends(userId);
        setFriends(res.data);
      } catch (err) {
        console.error("Failed to fetch friends:", err);
      }
    };
    fetchFriends();
  }, [user?._id, user?.id]);

  useEffect(() => {
    const fetchAllUsers = async () => {
      try {
        // Fetch a larger set of users (e.g., 100) to handle pagination on the client side
        const res = await userAPI.getAllUsers(1, 100);
        console.log("Fetched users response:", res.data);
        console.log("Total users fetched:", res.data.users?.length);
        setSuggestedUsers(res.data.users);
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };
    fetchAllUsers();
  }, []);

  const handleAddFriend = async (userToAdd) => {
    try {
      // 1. Get the correct ID (handle both _id and id)
      const targetId = userToAdd._id || userToAdd.id;

      if (!targetId) {
        console.error("Target user ID is missing!");
        return;
      }
      await userAPI.addFriendsToList(userToAdd);
      console.log("Emitting add friend notification to:", targetId);
      // SEND NOTIFICATION
      socket?.emit("sendNotification", {
        senderName: user.username,
        receiverId: targetId,
        type: "friendRequest",
      });

      // Optionally refresh friends list
      setFriends([...friends, userToAdd]);
    } catch (error) {
      console.log(error);
    }
  };

  const handleRemoveFriend = async (friendId) => {
    try {
      await userAPI.removeFriend(friendId);
      // SEND NOTIFICATION FOR UNFRIEND
      socket?.emit("sendNotification", {
        senderName: user.username,
        receiverId: friendId,
        type: "unfriend",
      });

      setFriends(friends.filter((f) => f._id !== friendId));
    } catch (error) {
      console.error("Failed to remove friend:", error);
    }
  };

  const displayedUsers = suggestedUsers.slice(0, visibleCount);
  const hasMore = visibleCount < suggestedUsers.length;
  console.log(
    "visibleCount:",
    visibleCount,
    "hasMore:",
    hasMore,
    "suggestedUsers length:",
    suggestedUsers.length,
  );

  return (
    <div className="sidebar">
      <div className="sidebarWrapper">
        <ul className="sidebarList">
          <li className="sidebarListItem">
            <RssFeed className="sidebarIcon" />
            <span className="sidebarListItemText">Feed</span>
          </li>
          <li className="sidebarListItem">
            <Chat className="sidebarIcon" />
            <span className="sidebarListItemText">Chats</span>
          </li>
          <li className="sidebarListItem">
            <PlayCircleFilledOutlined className="sidebarIcon" />
            <span className="sidebarListItemText">Videos</span>
          </li>
          <li className="sidebarListItem">
            <Group className="sidebarIcon" />
            <span className="sidebarListItemText">Groups</span>
          </li>
          <li className="sidebarListItem">
            <Bookmark className="sidebarIcon" />
            <span className="sidebarListItemText">Bookmarks</span>
          </li>
          <li className="sidebarListItem">
            <HelpOutline className="sidebarIcon" />
            <span className="sidebarListItemText">Questions</span>
          </li>
          <li className="sidebarListItem">
            <WorkOutline className="sidebarIcon" />
            <span className="sidebarListItemText">Jobs</span>
          </li>
          <li className="sidebarListItem">
            <Event className="sidebarIcon" />
            <span className="sidebarListItemText">Events</span>
          </li>
          <li className="sidebarListItem">
            <School className="sidebarIcon" />
            <span className="sidebarListItemText">Courses</span>
          </li>
        </ul>
        <h4 className="rightbarTitle" style={{ marginBottom: "10px" }}>
          Add Friends
        </h4>
        <ul className="sidebarFriendList">
          {displayedUsers.map((u) => {
            const isAdded = friends.some((f) => f._id === u._id);
            return (
              <li
                key={u._id}
                className="sidebarFriendListItem"
                style={{
                  display: "flex",
                  alignItems: "center",
                  marginBottom: "10px",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center" }}>
                  <img
                    src={
                      BuildImageUrl(
                        u?.profilePicture || "",
                        PF,
                        u?.updatedAt,
                      ) || PF + "person/noAvatar.png"
                    }
                    alt=""
                    className="sidebarFriendImg"
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "50%",
                      objectFit: "cover",
                      marginRight: "10px",
                    }}
                  />
                  <span className="sidebarFriendName">{u.username}</span>
                </div>
                <button
                  disabled={isAdded}
                  onClick={() => !isAdded && handleAddFriend(u)}
                  style={{
                    border: "none",
                    backgroundColor: isAdded ? "#ccc" : "#1877f2",
                    color: isAdded ? "black" : "white",
                    borderRadius: "5px",
                    padding: "5px 10px",
                    cursor: isAdded ? "default" : "pointer",
                  }}
                >
                  {isAdded ? "Added" : "Add"}
                </button>
              </li>
            );
          })}
        </ul>
        {hasMore && (
          <button
            className="sidebarButton"
            onClick={() => setVisibleCount((prev) => prev + 5)}
          >
            Show More
          </button>
        )}
        <hr className="sidebarHr" />
        <h4 className="rightbarTitle" style={{ marginBottom: "10px" }}>
          Friends
        </h4>
        <ul className="sidebarFriendList">
          {friends.map((u) => (
            <CloseFriend key={u._id} user={u} onRemove={handleRemoveFriend} />
          ))}
        </ul>
      </div>
    </div>
  );
}

export default Sidebar;
