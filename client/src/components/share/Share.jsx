import React, { useContext, useRef, useState, useCallback } from "react";
import PropTypes from "prop-types";
import {
  Cancel,
  PermMedia,
  Label,
  Room,
  EmojiEmotions,
} from "@mui/icons-material";
import "./Share.css";
import { AuthContext } from "../../context/AuthContext";
import { postAPI, uploadFile, userAPI } from "../../lib/api";
import { CircularProgress } from "@mui/material";
import { useSocket } from "../../context/socket/SocketContext";
import BuildImageUrl from "../../utils/BuildImageUrl.jsx";

function Share({ onPost }) {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { socket } = useSocket();
  const { user, dispatch } = useContext(AuthContext);
  const descRef = useRef();
  const profilePicInputRef = useRef();

  // Safety check for user object
  if (!user) {
    return (
      <div className="share">
        <div className="shareWrapper">
          <CircularProgress />
        </div>
      </div>
    );
  }

  // Handle file selection with preview
  const handleFileChange = useCallback((e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // 1. Validate File Type (Starts with 'image/' or 'video/')
    const isImage = selectedFile.type.startsWith("image/");
    const isVideo = selectedFile.type.startsWith("video/");

    if (!isImage && !isVideo) {
      setError("Invalid file type. Please select an image or a video.");
      return;
    }

    // 2. Validate File Size (Example: 5MB for images, 50MB for videos)
    const maxSize = isVideo ? 50 * 1024 * 1024 : 5 * 1024 * 1024;
    if (selectedFile.size > maxSize) {
      setError(
        `File too large. Max size for ${isImage ? "images" : "videos"} is ${isVideo ? "50MB" : "5MB"}.`,
      );
      return;
    }

    setFile(selectedFile);
    setPreview(URL.createObjectURL(selectedFile));
    setError(null);
  }, []);

  // Clear file selection
  const clearFile = useCallback(() => {
    setFile(null);
    setPreview(null);
    setError(null);
  }, []);

  // Handle profile picture update
  const handleProfilePictureUpdate = async (e, field) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!user?._id) {
      console.error("User ID is missing");
      setError("User session invalid. Please login again.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("File size too large. Maximum size is 5MB.");
      return;
    }
    setLoading(true);
    setError(null);

    try {
      // Create FormData to send the file
      const formData = new FormData();
      formData.append("file", file);
      const res = await userAPI.updateUserImages(formData, field);
      dispatch({ type: "UPDATE_USER", payload: res.data });
      localStorage.setItem("user", JSON.stringify(res.data));
    } catch (err) {
      console.error("Failed to update profile picture:", err);
      setError("Failed to update profile picture. Please try again.");
    }
    setLoading(false);
  };

  // Submit new post
  const submitHandler = async (e) => {
    e.preventDefault();

    if (!descRef.current?.value.trim() && !file) {
      setError("Please add a description or image");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("desc", descRef.current?.value || "");
      if (file) {
        formData.append("file", file);
      }
      const res = await postAPI.createPost(formData);

      // TRIGGER NOTIFICATION
      socket?.emit("sendNotification", {
        senderName: user.username,
        type: "newPost", // Unique type for new posts
      });

      // Reset form
      setFile(null);
      setPreview(null);
      descRef.current.value = "";

      if (onPost) {
        onPost(res.data);
      }
    } catch (err) {
      console.error("Share error:", err);
      setError(
        err.response?.data?.error?.message ||
          "Failed to share post. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="share">
      <div className="shareWrapper">
        <div className="shareTop">
          <label
            htmlFor="profilePictureInput"
            className="shareProfileImgContainer"
          >
            <img
              className="shareProfileImg"
              src={
                BuildImageUrl(
                  user?.profilePicture || "",
                  import.meta.env.VITE_PUBLIC_FOLDER,
                  user?.updatedAt,
                ) || import.meta.env.VITE_PUBLIC_FOLDER + "person/noAvatar.png"
              }
              alt=""
            />
          </label>
          <input
            type="file"
            id="profilePictureInput"
            ref={profilePicInputRef}
            style={{ display: "none" }}
            accept="image/*"
            onChange={(e) => handleProfilePictureUpdate(e, "profilePicture")}
          />
          <input
            placeholder={`What's in your mind ${user.username}?`}
            className="shareInput"
            ref={descRef}
            maxLength={500}
          />
        </div>
        <hr className="shareHr" />

        {/* Error message */}
        {error && (
          <div className="shareError">
            <span>{error}</span>
          </div>
        )}

        {/* Preview of selected image */}
        {preview && (
          <div className="shareImgContainer">
            <img className="shareImg" src={preview} alt="Preview" />
            <Cancel className="shareCancelImg" onClick={clearFile} />
          </div>
        )}

        <form className="shareBottom" onSubmit={submitHandler}>
          <div className="shareOptions">
            <label htmlFor="file" className="shareOption">
              <PermMedia htmlColor="tomato" className="shareIcon" />
              <span className="shareOptionText">Photo or Video</span>
              <input
                style={{ display: "none" }}
                type="file"
                id="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
              />
            </label>
            <div className="shareOption">
              <Label htmlColor="blue" className="shareIcon" />
              <span className="shareOptionText">Tag</span>
            </div>
            <div className="shareOption">
              <Room htmlColor="green" className="shareIcon" />
              <span className="shareOptionText">Location</span>
            </div>
            <div className="shareOption">
              <EmojiEmotions htmlColor="goldenrod" className="shareIcon" />
              <span className="shareOptionText">Feelings</span>
            </div>
          </div>
          <button className="shareButton" type="submit" disabled={loading}>
            {loading ? <CircularProgress color="white" size="20px" /> : "Share"}
          </button>
        </form>
      </div>
    </div>
  );
}

Share.propTypes = {
  onPost: PropTypes.func,
};

export default Share;
