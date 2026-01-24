import React, { useContext, useEffect, useState, useCallback } from "react";
import "./Rightbar.css";
import Online from "../online/online";
import { Remove, Add } from "@mui/icons-material";
import { Link } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { userAPI } from "../../lib/api";
import BuildImageUrl from "../../utils/BuildImageUrl.jsx";

function Rightbar({ user }) {
  const [users, setUsers] = useState([]);

  const [followings, setFollowings] = useState([]);
  const [loading, setLoading] = useState(false);
  const { user: currentUser, dispatch } = useContext(AuthContext);
  const [followed, setFollowed] = useState(
    currentUser?.followings?.includes(user?._id) || false,
  );
  const [followersCount, setFollowersCount] = useState(
    user?.followersCount || 0,
  );
  const PF = import.meta.env.VITE_PUBLIC_FOLDER || "/images/";

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await userAPI.getAllUsers();
        setUsers(res.data);
      } catch (err) {
        console.log(err);
      }
    };
    fetchUsers();
  }, []);

  useEffect(() => {
    setFollowersCount(user?.followersCount || 0);
  }, [user?.followersCount]);

  // Fetch user followings
  useEffect(() => {
    const getFollowings = async () => {
      if (!user?._id) return;

      setLoading(true);
      try {
        const res = await userAPI.getFollowings(user._id, 1, 6);
        setFollowings(res.data.followings || []);
      } catch (error) {
        console.log("Error fetching followings:", error);
        // Fallback to user.followings if API fails
        if (user.followings) {
          setFollowings(user.followings.slice(0, 5));
        }
      } finally {
        setLoading(false);
      }
    };

    getFollowings();
  }, [user?._id, user.followings]);

  // Update followed state when currentUser changes
  useEffect(() => {
    setFollowed(currentUser?.followings?.includes(user?._id));
  }, [currentUser?.followings, user?._id]);

  const handleClick = useCallback(async () => {
    try {
      if (followed) {
        await userAPI.unfollowUser(user._id);
        dispatch({ type: "UNFOLLOW", payload: user._id });
        setFollowersCount((prev) => Math.max(0, prev - 1));
      } else {
        await userAPI.followUser(user._id);
        dispatch({ type: "FOLLOW", payload: user._id });
        setFollowersCount((prev) => prev + 1);
      }
      setFollowed(!followed);
    } catch (error) {
      console.log("Follow/unfollow error:", error);
    }
  }, [followed, user._id, dispatch]);

  return (
    <div className="rightbar">
      <div className="rightbarWrapper">
        {user ? (
          <>
            {user?.username !== currentUser?.username && (
              <button className="rightbarFollowButton" onClick={handleClick}>
                {followed ? "Unfollow" : "Follow"}
                {followed ? <Remove /> : <Add />}
              </button>
            )}
            <h4 className="rightbarTitle">User information</h4>
            <div className="rightbarInfo">
              <div className="rightbarInfoItem">
                <span className="rightbarInfoKey">City:</span>
                <span className="rightbarInfoValue">
                  {user.city || "Not specified"}
                </span>
              </div>
              <div className="rightbarInfoItem">
                <span className="rightbarInfoKey">From:</span>
                <span className="rightbarInfoValue">
                  {user.from || "Not specified"}
                </span>
              </div>
              <div className="rightbarInfoItem">
                <span className="rightbarInfoKey">Relationship:</span>
                <span className="rightbarInfoValue">
                  {user.relationship || "Not specified"}
                </span>
              </div>
              <div className="rightbarInfoItem">
                <span className="rightbarInfoKey">Followers:</span>
                <span className="rightbarInfoValue">{followersCount}</span>
              </div>
              <div className="rightbarInfoItem">
                <span className="rightbarInfoKey">Followings:</span>
                <span className="rightbarInfoValue">
                  {user.followingsCount || 0}
                </span>
              </div>
            </div>
            <h4 className="rightbarTitle">User followings</h4>
            <div className="rightbarFollowings">
              {followings.length > 0 ? (
                followings.slice(0, 5).map((friend) => (
                  <Link
                    to={"/profile/" + friend?.username}
                    style={{ textDecoration: "none" }}
                    key={friend._id}
                  >
                    <div className="rightbarFollowing">
                      <img
                        src={
                          BuildImageUrl(
                            friend?.profilePicture || "",
                            PF,
                            friend?.updatedAt,
                          ) || PF + "person/noAvatar.png"
                        }
                        alt=""
                        className="rightbarFollowingImg"
                      />
                      <span className="rightbarFollowingName">
                        {friend.username}
                      </span>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="noFollowings">No followings yet</p>
              )}
            </div>
          </>
        ) : (
          <>
            <div className="birthdayContainer">
              <img className="birthdayImg" src="images/gift.png" alt="" />
              <span className="birthdayText">
                <b>Pola Foster</b> and <b>3 other friends</b> have a birhday
                today.
              </span>
            </div>
            <img className="rightbarAd" src="images/ad.png" alt="" />
            <h4 className="rightbarTitle">Online Friends</h4>
            <ul className="rightbarFriendList">
              {users.slice(0, 5).map((u) => (
                <Online key={u._id} user={u} />
              ))}
            </ul>
          </>
        )}
      </div>
    </div>
  );
}

export default Rightbar;
