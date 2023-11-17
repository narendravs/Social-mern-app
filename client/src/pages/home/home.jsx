import React, { useContext } from "react";
import Topbar from "../../components/topbar/topbar";
import Sidebar from "../../components/sidebar/sidebar";
import Feed from "../../components/feed/feed";
import Rightbar from "../../components/rightbar/rightbar";
import "./home.css";
import { AuthContext } from "../../context/AuthContext";

function Home() {
  const { user } = useContext(AuthContext);
  return (
    <div>
      <Topbar />
      <div className="homeContainer">
        <Sidebar />
        <Feed ussername={user.ussername} />
        <Rightbar user={user} />
      </div>
    </div>
  );
}

export default Home;
