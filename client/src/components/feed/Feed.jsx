import React, { useContext, useEffect, useState, useCallback } from "react";
import PropTypes from "prop-types";
import Post from "../post/Post";
import Share from "../share/share";
import { AuthContext } from "../../context/AuthContext";
import { postAPI } from "../../lib/api";
import { CircularProgress, Button } from "@mui/material";
import "./Feed.css";

function Feed({ username }) {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);

  const { user } = useContext(AuthContext);

  const fetchPosts = useCallback(
    async (pageNum = 1, isLoadMore = false) => {
      setLoading(true);
      try {
        let res;
        if (username) {
          res = await postAPI.getProfilePosts(username, pageNum, 10);
        } else {
          res = await postAPI.getRandomPosts(pageNum, 10);
        }

        const { posts: newPosts, hasMore: moreAvailable } = res.data || {};
        console.log("Fetched posts:", newPosts?.length || 0);
        if (isLoadMore && Array.isArray(newPosts)) {
          console.log("Appending posts for load more", newPosts);
          setPosts((prev) => [...prev, ...newPosts]);
        } else if (Array.isArray(newPosts)) {
          console.log("Setting posts", newPosts);
          setPosts(newPosts);
        }

        setHasMore(moreAvailable !== false);
      } catch (err) {
        console.error("Error fetching posts:", err);
      } finally {
        setLoading(false);
      }
    },
    [username, user?._id],
  );

  useEffect(() => {
    if (user) {
      setPage(1);
      fetchPosts(1, false);
    }
  }, [username, user?._id, fetchPosts]);

  const loadMore = useCallback(() => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, true);
  }, [page, fetchPosts]);

  const handleDelete = useCallback((postId) => {
    if (typeof postId !== "string") return;
    setPosts((prev) => prev.filter((p) => p?._id !== postId));
  }, []);

  const handleUpdate = useCallback((updatedPost) => {
    if (!updatedPost || typeof updatedPost !== "object") return;
    setPosts((prev) =>
      prev.map((p) => (p?._id === updatedPost?._id ? updatedPost : p)),
    );
  }, []);

  const handleNewPost = useCallback((newPost) => {
    if (!newPost) return;
    setPosts((prev) => [newPost, ...prev]);
  }, []);

  return (
    <div className="feed">
      <div className="feedWrapper">
        <Share onPost={handleNewPost} />

        {loading && posts.length === 0 ? (
          <div className="feedLoading">
            <CircularProgress />
          </div>
        ) : posts.length === 0 ? (
          <div className="feedEmpty">
            <p>No posts yet. Share something to get started!</p>
          </div>
        ) : (
          <>
            {posts.map((p) => (
              <Post
                key={p?._id || Math.random()}
                post={p}
                onDelete={handleDelete}
                onUpdate={handleUpdate}
              />
            ))}

            {hasMore && (
              <div className="feedLoadMore">
                <Button
                  variant="outlined"
                  onClick={loadMore}
                  disabled={loading}
                >
                  {loading ? "Loading..." : "Load More"}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

Feed.propTypes = {
  username: PropTypes.string,
};

Feed.defaultProps = {
  username: undefined,
};

export default Feed;
