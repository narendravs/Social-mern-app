import React, { useState, useContext, useEffect } from "react";
import { AuthContext } from "../../context/AuthContext";
import { userAPI } from "../../lib/api";
import { useSocket } from "../../context/socket/SocketContext";
import "./FollowButton.css";

const FollowButton = ({ targetUserId, targetUsername }) => {
  const { user: currentUser, dispatch } = useContext(AuthContext);
  const { socket } = useSocket();

  // Local state for immediate UI feedback
  const [followed, setFollowed] = useState(
    currentUser?.followings?.includes(targetUserId),
  );
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setFollowed(currentUser?.followings?.includes(targetUserId));
  }, [currentUser?.followings, targetUserId]);

  const handleFollow = async (e) => {
    e.preventDefault(); // Prevent post link clicks
    if (loading) return;

    setLoading(true);
    try {
      if (followed) {
        await userAPI.unfollowUser(targetUserId);
        dispatch({ type: "UNFOLLOW", payload: targetUserId });
        setFollowed(false);
      } else {
        await userAPI.followUser(targetUserId);
        dispatch({ type: "FOLLOW", payload: targetUserId });
        setFollowed(true);

        // Send real-time notification
        socket?.emit("sendNotification", {
          senderName: currentUser.username,
          receiverId: targetUserId,
          type: "follow", // Or "follow"
        });
      }
    } catch (err) {
      console.error("Follow error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      className={`postFollowButton ${followed ? "following" : ""}`}
      onClick={handleFollow}
      disabled={loading}
    >
      {loading ? "..." : followed ? "Following" : "Follow"}
    </button>
  );
};

export default React.memo(FollowButton);
