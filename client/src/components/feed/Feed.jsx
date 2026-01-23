import React, { useContext, useEffect, useState } from "react";
import Post from "../../components/post/post";
import Share from "../share/share";
//import { Posts as posts } from "../../dummyData";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import "./feed.css";

function Feed({ username }) {
  const [posts, setPosts] = useState([]);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    const fetchPosts = async () => {
      const res = username
        ? await axios.get("/posts/profile/" + username)
        : await axios.get("posts/timeline/" + user._id);
      setPosts(
        res.data.sort((p1, p2) => {
          return new Date(p2.createdAt) - new Date(p1.createdAt);
        })
      );
    };
    fetchPosts();
  }, [username, user._id]);
  return (
    <div className="feed">
      <div className="feedWrapper">
        <h2>
          <Share />
          {posts.map((p) => (
            <Post key={p._id} post={p} />
          ))}
        </h2>
      </div>
    </div>
  );
}

export default Feed;
