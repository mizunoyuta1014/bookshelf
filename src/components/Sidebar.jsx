import React from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <nav>
      <Link to="/books">蔵書</Link>
      <Link to="/want">読みたい本</Link>
    </nav>
  );
};

export default Sidebar;
