import "./App.css";
import "./styles/design-system.css";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/SupabaseAuthContext.jsx";
import { ThemeProvider } from "./contexts/ThemeContext.jsx";
import { ErrorProvider } from "./components/ErrorHandler.jsx";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./components/Home";
import Want from "./components/Want";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";
import Books from "./components/Books";
import Statistics from "./components/Statistics";
import ThemeToggle from "./components/ThemeToggle";

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <ErrorProvider>
          <Router>
            <ProtectedRoute>
              <ThemeToggle />
              <Header />
              <div className="mainarea">
                <Sidebar />
                <Routes>
                  <Route path="/" element={<Home />}></Route>
                  <Route path="/books" element={<Books />}></Route>
                  <Route path="/statistics" element={<Statistics />}></Route>
                  <Route path="/want" element={<Want />}></Route>
                </Routes>
              </div>
            </ProtectedRoute>
          </Router>
        </ErrorProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}

export default App;
