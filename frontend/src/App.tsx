import React, { useState, useEffect } from "react";

import PublicPage from "./components/public/PublicPage";
import AdminPage from "./components/admin/AdminPage";
import FavoritesPage from "./components/public/FavoritesPage";
import ShopkeeperPage from "./components/shopkeeper/ShopkeeperPage";
import AboutPage from "./components/public/AboutPage";
import TermsPage from "./components/public/TermsPage";
import PrivacyPage from "./components/public/PrivacyPage";

import Footer from "./components/shared/Footer";

type View = "public" | "admin" | "favorites" | "shopkeeper" | "about" | "privacy" | "terms";

const App: React.FC = () => {
  // Check URL hash on first load — navigating to /#admin opens the panel
  const initialView: View =
    window.location.hash === "#admin" ? "admin" : "public";

  const [view, setView] = useState<View>(initialView);
  const [exploreFilter, setExploreFilter] = useState<string | null>(null);

  // Secret keyboard shortcut: Ctrl + Shift + A  →  toggle admin view
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "A") {
        setView(prev => (prev === "admin" ? "public" : "admin"));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Keep URL hash in sync so the admin tab can be bookmarked
  useEffect(() => {
    if (view === "admin") {
      window.history.replaceState(null, "", "#admin");
    } else {
      window.history.replaceState(null, "", window.location.pathname);
    }
  }, [view]);

  const handleExplore = (filter: string) => {
    setExploreFilter(filter);
    setView("public");
  };

  return (
    <div className="app-container">

      {view === "public" && (
        <PublicPage
          onGoAdmin={() => setView("admin")}
          onGoFavorites={() => setView("favorites")}
          onGoShopkeeper={() => setView("shopkeeper")}
          initialFilter={exploreFilter}
          onFilterApplied={() => setExploreFilter(null)}
        />
      )}

      {view === "admin" && (
        <AdminPage onGoPublic={() => setView("public")} />
      )}

      {view === "favorites" && (
        <FavoritesPage
          onBack={() => setView("public")}
          onShopClick={() => setView("public")}
        />
      )}

      {view === "shopkeeper" && (
        <ShopkeeperPage onBack={() => setView("public")} />
      )}

      {view === "about" && (
        <AboutPage onBack={() => setView("public")} />
      )}

      {view === "privacy" && (
        <PrivacyPage onBack={() => setView("public")} />
      )}

      {view === "terms" && (
        <TermsPage onBack={() => setView("public")} />
      )}

      {view !== "admin" && view !== "shopkeeper" && view !== "about" && view !== "privacy" && view !== "terms" && (
        <Footer
          onAbout={() => setView("about")}
          onPrivacy={() => setView("privacy")}
          onTerms={() => setView("terms")}
          onExplore={handleExplore}
        />
      )}

    </div>
  );
};

export default App;