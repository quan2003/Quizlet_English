import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import AppLayout from "./ui/AppLayout.jsx";
import FlashcardsPage from "./pages/FlashcardsPage.jsx";
import HomePage from "./pages/HomePage.jsx";
import LearnPage from "./pages/LearnPage.jsx";
import MatchPage from "./pages/MatchPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import SetDetailPage from "./pages/SetDetailPage.jsx";
import TestPage from "./pages/TestPage.jsx";
import "./styles.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/study/:slug" element={<SetDetailPage />} />
          <Route path="/study/:slug/flashcards" element={<FlashcardsPage />} />
          <Route path="/study/:slug/learn" element={<LearnPage />} />
          <Route path="/study/:slug/test" element={<TestPage />} />
          <Route path="/study/:slug/match" element={<MatchPage />} />
          <Route path="/thong-ke" element={<ProfilePage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
