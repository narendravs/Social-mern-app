import React, { useContext, useState, useCallback, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  Person,
  Chat,
  Notifications,
  Logout,
  Settings,
} from "@mui/icons-material";
import "./Topbar.css";
import { AuthContext } from "../../context/AuthContext";
import { userAPI } from "../../lib/api";
import { useSocket } from "../../context/socket/SocketContext";
import BuildImageUrl from "../../utils/BuildImageUrl.jsx";

function Topbar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [showNotifDropdown, setShowNotifDropdown] = useState(false);

  const { user: currentUser, logout } = useContext(AuthContext);
  const PF = import.meta.env.VITE_PUBLIC_FOLDER || "/images/";
  const navigate = useNavigate();
  const { socket } = useSocket();

  // Handle incoming notifications
  useEffect(() => {
    socket?.on("getNotification", (data) => {
      // data contains { senderName, type } from your server
      console.log("Received notification:", data);
      setNotifications((prev) => [data, ...prev]);
    });
    return () => socket?.off("getNotification");
  }, [socket]);

  // Handle search
  useEffect(() => {
    const searchUsers = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const res = await userAPI.searchUsers(searchQuery, 1, 5);
        setSearchResults(res.data.users || []);
        setShowSearchResults(true);
      } catch (error) {
        console.error("Search error:", error);
        setSearchResults([]);
      }
    };

    const debounce = setTimeout(searchUsers, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const handleLogout = useCallback(async () => {
    await logout();
    navigate("/login");
  }, [logout, navigate]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/?search=${encodeURIComponent(searchQuery)}`);
      setShowSearchResults(false);
    }
  };

  const handleUserClick = () => {
    setShowUserMenu(!showUserMenu);
  };

  // Helper to format notification messages
  const displayNotification = ({ senderName, type }) => {
    let action;
    if (type === "like") action = "liked your post";
    else if (type === "comment") action = "commented on your post";
    else if (type === "friendRequest") action = "added you as a friend";
    else if (type === "unfriend") action = "unfollowed you";
    else if (type === "newPost") action = "shared a new post";
    else action = "interacted with you";

    return (
      <span className="notifText">
        <b>{senderName}</b> {action}
      </span>
    );
  };

  // Helper to count specific notification categories
  const getCount = (category) => {
    // CATEGORY: PERSON (Friends/Follows)
    if (category === "person") {
      return notifications.filter(
        (n) => n.type === "friendRequest" || n.type === "follow",
      ).length;
    }

    // CATEGORY: CHAT (Direct Messages)
    if (category === "chat") {
      return notifications.filter((n) => n.type === "comment").length;
    }

    // CATEGORY: GENERAL (Likes, Comments)
    if (category === "general") {
      return notifications.filter((n) =>
        ["like", "comment", "friendRequest", "newPost"].includes(n.type),
      ).length;
    }
    return 0;
  };
  const getFilteredNotifications = () => {
    if (showNotifDropdown === "person") {
      return notifications.filter((n) =>
        ["friendRequest", "follow", "unfriend"].includes(n.type),
      );
    }
    if (showNotifDropdown === "chat") {
      // Note: You should check if your chat type is "message" or "comment"
      return notifications.filter((n) => n.type === "comment");
    }
    if (showNotifDropdown === "general") {
      return notifications.filter((n) =>
        ["like", "comment", "newPost"].includes(n.type),
      );
    }
    return [];
  };

  const activeNotifications = getFilteredNotifications();

  const handleRead = () => {
    setNotifications([]);
    setShowNotifDropdown(false);
  };

  return (
    <div className="topbarContainer">
      <div className="topbarLeft">
        <Link to="/" style={{ textDecoration: "none" }}>
          <span className="logo">Narensocial</span>
        </Link>
      </div>

      <div className="topbarCenter">
        <form className="searchbar" onSubmit={handleSearchSubmit}>
          <Search className="searchIcon" />
          <input
            placeholder="Search for friend, post or video"
            className="searchInput"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() =>
              searchResults.length > 0 && setShowSearchResults(true)
            }
            onBlur={() => setTimeout(() => setShowSearchResults(false), 200)}
          />

          {/* Search dropdown */}
          {showSearchResults && searchResults.length > 0 && (
            <div className="searchResults">
              {searchResults.map((result) => (
                <Link
                  key={result._id}
                  to={`/profile/${result.username}`}
                  className="searchResultItem"
                  onClick={() => {
                    setSearchQuery("");
                    setShowSearchResults(false);
                  }}
                >
                  <img
                    src={
                      result.profilePicture
                        ? result.profilePicture.startsWith("http")
                          ? result.profilePicture
                          : PF + result.profilePicture.replace("/images/", "")
                        : PF + "person/noAvatar.png"
                    }
                    alt=""
                    className="searchResultImg"
                  />
                  <span className="searchResultName">{result.username}</span>
                </Link>
              ))}
            </div>
          )}
        </form>
      </div>

      <div className="topbarRight">
        <div className="topbarLink">
          <Link to="/" style={{ textDecoration: "none", color: "inherit" }}>
            <span className="topbarLink">Homepage</span>
          </Link>
        </div>
        <div className="topbarIcons">
          <div className="topbarIconItem">
            <Person
              onClick={() =>
                setShowNotifDropdown(
                  showNotifDropdown === "person" ? null : "person",
                )
              }
            />
            {getCount("person") > 0 && (
              <span className="topbarIconBadge">{getCount("person")}</span>
            )}
          </div>
          <div className="topbarIconItem">
            <Chat
              onClick={() =>
                setShowNotifDropdown(
                  showNotifDropdown === "chat" ? null : "chat",
                )
              }
            />
            {getCount("chat") > 0 && (
              <span className="topbarIconBadge">{getCount("chat")}</span>
            )}
          </div>
          <div className="topbarIconItem">
            <Notifications
              onClick={() =>
                setShowNotifDropdown(
                  showNotifDropdown === "general" ? null : "general",
                )
              }
            />
            {getCount("general") > 0 && (
              <span className="topbarIconBadge">{getCount("general")}</span>
            )}
          </div>
          {showNotifDropdown && (
            <div className="notifDropdown">
              <div className="notifHeader">
                <button onClick={handleRead}>Mark as read</button>
              </div>
              <div className="notifList">
                {activeNotifications.length > 0 ? (
                  activeNotifications.map((n, index) => (
                    <div key={index} className="notifItem">
                      {displayNotification(n)}
                    </div>
                  ))
                ) : (
                  <span className="noNotif">No new notifications</span>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="userMenuContainer">
          <img
            src={
              BuildImageUrl(
                currentUser?.profilePicture || "",
                PF,
                currentUser?.updatedAt,
              ) || PF + "person/noAvatar.png"
            }
            alt=""
            className="topbarImg"
            onClick={handleUserClick}
          />

          {showUserMenu && (
            <div className="userDropdown">
              <Link
                to={`/profile/${currentUser.username}`}
                className="dropdownItem"
              >
                <Person fontSize="small" />
                <span>Profile</span>
              </Link>
              <div className="dropdownItem">
                <Settings fontSize="small" />
                <span>Settings</span>
              </div>
              <div className="dropdownDivider" />
              <div className="dropdownItem logout" onClick={handleLogout}>
                <Logout fontSize="small" />
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Topbar;
