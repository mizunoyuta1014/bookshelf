import "./App.css";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router-dom";
import Home from "./components/Books";
import Want from "./components/Want";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Books from "./components/Books";

function App() {
  return (
    <Router>
      <Header />
      <Sidebar />
      <Routes>
        <Route path="/" element={<Home />}></Route>
        <Route path="/books" element={<Books />}></Route>
        <Route path="/want" element={<Want />}></Route>
      </Routes>
    </Router>
  );
}

export default App;
