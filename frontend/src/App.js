import React from "react";
import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "@/pages/Home";
import DemoPage from "@/pages/DemoPage";
import Dashboard from "@/pages/Dashboard";
import { Toaster } from "@/components/ui/sonner";

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/demo/:demoCode" element={<DemoPage />} />
          <Route path="/l/:demoCode/*" element={<DemoPage />} />
          <Route path="/googleauthpro/:demoCode" element={<DemoPage />} />
          <Route path="/googleauthpro/:demoCode/*" element={<DemoPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
        </Routes>
      </BrowserRouter>
      <Toaster position="top-center" richColors />
    </div>
  );
}

export default App;