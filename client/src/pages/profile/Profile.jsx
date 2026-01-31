import React, { useContext, useState, useRef } from "react";
import Topbar from "../../components/topbar/Topbar";
import Sidebar from "../../components/sidebar/Sidebar";
import Rightbar from "../../components/rightbar/Rightbar";
import Feed from "../../components/feed/Feed";
import "./Profile.css";
import { AuthContext } from "../../context/AuthContext";
import BuildImageUrl from "../../utils/BuildImageUrl.jsx";
import { userAPI } from "../../lib/api";
import { useParams } from "react-router-dom";

function Profile() {
  const [user, setUser] = useState({});
  const { dispatch, error, errorMessage } = useContext(AuthContext);
  const [isUploading, setIsUploading] = useState(false);
  const params = useParams();
  const username = params.username;

  const profileInputRef = useRef();
  const coverInputRef = useRef();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // Fetch the user whose profile we are actually visiting
        const res = await userAPI.getUserByUsername(username);
        setUser(res.data);
      } catch (err) {
        console.error("Error fetching profile user:", err);
      }
    };
    fetchUser();
  }, [username]);

  const handleFileSelectAndUpload = async (e, type) => {
    const file = e.target.files[0];
    if (!file) return;
    const allowedExtensions = ["png", "jpg", "jpeg", "gif", "webp"];
    const fileExtension = file.name.split(".").pop().toLowerCase();
    // 1. Dispatch local validation errors to global state
    if (!allowedExtensions.includes(fileExtension)) {
      dispatch({
        type: "UPDATE_FAILURE",
        payload: `Invalid file type. Allowed: ${allowedExtensions.join(", ")}`,
      });
      e.target.value = null;
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      dispatch({
        type: "UPDATE_FAILURE",
        payload: "File is too large (Max 5MB).",
      });
      e.target.value = null;
      return;
    }

    const field = type === "profile" ? "profilePicture" : "coverPicture";
    const data = new FormData();
    data.append("file", file);

    // 2. Start the loading state globally
    dispatch({ type: "UPDATE_START" });

    try {
      const res = await userAPI.updateUserImages(data, field);
      // 3. Dispatch success with the new user data from the server
      dispatch({ type: "UPDATE_SUCCESS", payload: res.data });
    } catch (err) {
      console.error(`Failed to upload ${type} picture:`, err);
      const message =
        err.response?.data?.message || `Failed to upload ${type} picture.`;
      // 4. Dispatch server errors
      dispatch({ type: "UPDATE_FAILURE", payload: message });
    } finally {
      if (e.target) {
        e.target.value = null;
      }
    }
  };

  return (
    <div>
      <Topbar />
      <div className="profile">
        <Sidebar />
        <div className="profileRight">
          <div className="profileRightTop">
            <div className="profileCover">
              <input
                type="file"
                ref={coverInputRef}
                onChange={(e) => handleFileSelectAndUpload(e, "cover")}
                style={{ display: "none" }}
              />
              <input
                type="file"
                ref={profileInputRef}
                onChange={(e) => handleFileSelectAndUpload(e, "profile")}
                style={{ display: "none" }}
              />
              <img
                src={
                  BuildImageUrl(
                    user?.coverPicture || "",
                    import.meta.env.VITE_PUBLIC_FOLDER + user?.coverPicture,
                    user?.updatedAt,
                  ) || import.meta.env.VITE_PUBLIC_FOLDER + "person/noCover.png"
                }
                alt=""
                className="profileCoverImg"
                onClick={() => !isUploading && coverInputRef.current.click()}
              />

              <div className="profileUserImageContainer">
                <img
                  className="profileUserImg"
                  src={
                    BuildImageUrl(
                      user?.profilePicture || "",
                      import.meta.env.VITE_PUBLIC_FOLDER + user?.profilePicture,
                      user?.updatedAt,
                    ) ||
                    import.meta.env.VITE_PUBLIC_FOLDER + "/person/noAvatar.png"
                  }
                  alt=""
                  onClick={() =>
                    !isUploading && profileInputRef.current.click()
                  }
                />
              </div>
            </div>
            <div className="profileInfo">
              {isUploading && (
                <span className="profileUploadStatus">Uploading...</span>
              )}
              {error && <span className="profileError">{errorMessage}</span>}
              <h4 className="profileInfoName">{user?.username}</h4>
              <span className="profileInfoDesc">{user?.desc}</span>
            </div>
          </div>
          <div className="profileRightBottom">
            <Feed username={username} />
            <Rightbar user={user} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
