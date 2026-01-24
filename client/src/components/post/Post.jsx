import { Link } from "react-router-dom";
import React, {
  useContext,
  useEffect,
  useState,
  useCallback,
  memo,
} from "react";
import PropTypes from "prop-types";
import { MoreVert, Delete, Edit, Report } from "@mui/icons-material";
import { AuthContext } from "../../context/AuthContext";
import { postAPI, userAPI } from "../../lib/api";
import "./Post.css";
import { useSocket } from "../../context/socket/SocketContext";
import FollowButton from "../follow/FollowButton";
import BuildImageUrl from "../../utils/BuildImageUrl.jsx";
import FormatDate from "../../utils/FormatDate.jsx";

const Post = memo(function Post({ post, onDelete, onUpdate }) {
  const [like, setLike] = useState(post?.likeCount || post?.likes?.length || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [user, setUser] = useState({});
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editDesc, setEditDesc] = useState(post?.desc || "");
  const [comments, setComments] = useState([]);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentCount, setCommentCount] = useState(post?.commentCount || 0);
  const { socket } = useSocket();
  const PF = import.meta.env.VITE_PUBLIC_FOLDER || "/images/";
  const { user: currentUser } = useContext(AuthContext);
  const currentUserId = currentUser?._id || currentUser?.id;
  const isOwner = currentUserId === post?.userId;

  useEffect(() => {
    setIsLiked(post?.likes?.includes(currentUserId));
  }, [currentUserId, post?.likes]);

  useEffect(() => {
    if (!post?.userId) return;
    const fetchUser = async () => {
      try {
        const res = await userAPI.getUser(post.userId);
        setUser(res.data || {});
      } catch (err) {
        console.error("Error fetching user:", err);
        setUser({});
      }
    };
    fetchUser();
  }, [post?.userId]);

  // Sync author avatar if the current user owns this post and updates their profile
  useEffect(() => {
    if (post?.userId && currentUserId === post.userId) {
      setUser((prev) => ({
        ...prev,
        profilePicture: currentUser?.profilePicture,
        username: currentUser?.username || prev?.username,
        updatedAt: currentUser?.updatedAt || prev?.updatedAt,
      }));
    }
  }, [
    post?.userId,
    currentUserId,
    currentUser?.profilePicture,
    currentUser?.username,
    currentUser?.updatedAt,
  ]);

  const likeHandler = useCallback(() => {
    if (!post?._id) return;

    // Send notification only if we are LIKING (not unliking) and we aren't liking our own post
    const originalLikedState = isLiked;
    console.log("Like handler invoked. username:", currentUser.username);
    postAPI.likePost(post._id).then(() => {
      // Only send notification if we are LIKING (not unliking)
      // and we aren't liking our own post
      if (!originalLikedState && post.userId !== currentUserId) {
        console.log("Emitting like notification to:", post.userId);
        socket?.emit("sendNotification", {
          senderName: currentUser.username,
          receiverId: post.userId,
          type: "like",
        });
      }
    });

    // Optimistic UI Update: Update immediately without waiting
    setLike((prev) => (isLiked ? Math.max(0, prev - 1) : prev + 1));
    setIsLiked(!isLiked);

    postAPI.likePost(post._id).catch((err) => {
      // Revert changes if API fails
      setLike((prev) => (isLiked ? prev + 1 : Math.max(0, prev - 1)));
      setIsLiked(isLiked);
      console.error("Like error:", err);
    });
  }, [post?._id, isLiked, currentUser, socket]);

  const handleToggleComments = useCallback(async () => {
    const shouldShow = !showComments;
    setShowComments(shouldShow);

    if (shouldShow && comments.length === 0 && commentCount > 0) {
      setCommentsLoading(true);
      try {
        const res = await postAPI.getComments(post._id);
        setComments(res.data);
      } catch (err) {
        console.error("Failed to fetch comments", err);
      } finally {
        setCommentsLoading(false);
      }
    }
  }, [showComments, comments.length, post._id, commentCount]);

  const handleCommentSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!newComment.trim()) return;

      try {
        const res = await postAPI.addComment(post._id, { text: newComment });

        // SEND NOTIFICATION
        if (post.userId !== currentUserId) {
          console.log("Emitting comment notification to:", post.userId);
          socket?.emit("sendNotification", {
            senderName: currentUser.username,
            receiverId: post.userId,
            type: "comment",
          });
        }

        setComments((prev) => [res.data, ...prev]);
        setCommentCount((prev) => prev + 1);
        setNewComment("");
      } catch (err) {
        console.error("Failed to add comment", err);
      }
    },
    [newComment, post._id, currentUser, socket],
  );

  const handleDelete = useCallback(async () => {
    if (!post?._id) return;
    if (!window.confirm("Are you sure you want to delete this post?")) return;

    try {
      await postAPI.deletePost(post._id);
      if (onDelete) onDelete(post._id);
    } catch (err) {
      console.error("Delete error:", err);
    }
  }, [post?._id, onDelete]);

  const handleUpdate = useCallback(async () => {
    if (!post?._id || !editDesc.trim()) return;

    try {
      const res = await postAPI.updatePost(post._id, { desc: editDesc });
      post.desc = res?.data?.desc;
      setIsEditing(false);
      if (onUpdate) onUpdate(res?.data);
    } catch (err) {
      console.error("Update error:", err);
    }
  }, [editDesc, onUpdate, post]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showMenu && !e.target.closest(".postTopRight")) {
        setShowMenu(false);
      }
    };

    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, [showMenu]);

  return (
    <div className="post">
      <div className="postWrapper">
        <div className="postTop">
          <div className="postTopLeft">
            <Link to={`/profile/${user?.username || ""}`}>
              <img
                className="postProfileImg"
                src={
                  BuildImageUrl(
                    user?.profilePicture || "",
                    PF,
                    user?.updatedAt,
                  ) || PF + "person/noAvatar.png"
                }
                alt=""
              />
            </Link>
            <div className="postTopLeftInfo">
              <Link
                to={`/profile/${user?.username || ""}`}
                className="postUsernameLink"
              >
                <span className="postUsername">
                  {user?.username || "Unknown"}
                </span>
              </Link>
              <span className="postDate">{FormatDate(post?.createdAt)}</span>
            </div>
          </div>
          <div className="postTopRight">
            {!isOwner && (
              <FollowButton
                targetUserId={post.userId}
                targetUsername={user?.username}
              />
            )}
            <div
              className="postMenuButton"
              onClick={() => setShowMenu(!showMenu)}
            >
              <MoreVert />
            </div>
            {showMenu && (
              <div className="postMenu">
                {isOwner && (
                  <>
                    <div
                      className="postMenuItem"
                      onClick={() => {
                        setIsEditing(true);
                        setShowMenu(false);
                      }}
                    >
                      <Edit fontSize="small" />
                      <span>Edit</span>
                    </div>
                    <div className="postMenuItem delete" onClick={handleDelete}>
                      <Delete fontSize="small" />
                      <span>Delete</span>
                    </div>
                  </>
                )}
                <div className="postMenuItem">
                  <Report fontSize="small" />
                  <span>Report</span>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="postCenter">
          {isEditing ? (
            <div className="postEditContainer">
              <textarea
                className="postEditInput"
                value={editDesc}
                onChange={(e) => setEditDesc(e.target.value)}
                maxLength={500}
              />
              <div className="postEditActions">
                <button
                  className="postEditCancel"
                  onClick={() => setIsEditing(false)}
                >
                  Cancel
                </button>
                <button className="postEditSave" onClick={handleUpdate}>
                  Save
                </button>
              </div>
            </div>
          ) : (
            <span className="postText">{post?.desc}</span>
          )}
          {post?.img && (
            <img
              className="postImg"
              src={BuildImageUrl(post.img, PF)}
              alt=""
              loading="lazy"
            />
          )}
        </div>
        <div className="postBottom">
          <div className="postBottomLeft">
            <img
              className="likeIcon"
              src={`${PF}like.png`}
              onClick={likeHandler}
              alt=""
            />
            <img
              className="likeIcon"
              src={`${PF}heart.png`}
              onClick={likeHandler}
              alt=""
            />
            <span className="postLikeCounter">
              {like} {like === 1 ? "person" : "people"} like it
            </span>
          </div>
          <div className="postBottomRight">
            <span className="postCommentText" onClick={handleToggleComments}>
              {commentCount} {commentCount === 1 ? "comment" : "comments"}
            </span>
          </div>
        </div>
        {showComments && (
          <div className="postCommentsSection">
            <div className="postCommentInputContainer">
              <img
                className="postCommentProfileImg"
                src={
                  BuildImageUrl(
                    currentUser?.profilePicture,
                    PF,
                    currentUser?.updatedAt,
                  ) || PF + "person/noAvatar.png"
                }
                alt=""
              />
              <form onSubmit={handleCommentSubmit} className="postCommentForm">
                <input
                  type="text"
                  className="postCommentInput"
                  placeholder="Write a comment..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                />
                <button
                  type="submit"
                  className="postCommentSubmit"
                  disabled={!newComment.trim()}
                >
                  Send
                </button>
              </form>
            </div>
            {commentsLoading ? (
              <div className="commentsLoading">Loading comments...</div>
            ) : (
              <div className="postCommentsList">
                {comments.map((comment) => (
                  <div
                    key={comment._id || comment.createdAt}
                    className="postComment"
                  >
                    <Link to={`/profile/${comment.username}`}>
                      <img
                        className="postCommentProfileImg"
                        src={
                          BuildImageUrl(comment.profilePicture, PF) ||
                          PF + "person/noAvatar.png"
                        }
                        alt=""
                      />
                    </Link>
                    <div className="postCommentBody">
                      <Link
                        to={`/profile/${comment.username}`}
                        className="postCommentUsernameLink"
                      >
                        <span className="postCommentUsername">
                          {comment.username}
                        </span>
                      </Link>
                      <p className="postCommentTextContent">{comment.text}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
});
Post.propTypes = {
  post: PropTypes.shape({
    _id: PropTypes.string,
    userId: PropTypes.string,
    desc: PropTypes.string,
    img: PropTypes.string,
    likes: PropTypes.arrayOf(PropTypes.string),
    likeCount: PropTypes.number,
    commentCount: PropTypes.number,
    createdAt: PropTypes.string,
  }),
  onDelete: PropTypes.func,
  onUpdate: PropTypes.func,
};

Post.defaultProps = {
  post: {},
  onDelete: undefined,
  onUpdate: undefined,
};

export default Post;
