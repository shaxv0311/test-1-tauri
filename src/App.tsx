import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import AppRoutes from "./router/AppRoutes";
import { checkForUpdates } from "./services/updater";

export default function App() {
  useEffect(() => {
    checkForUpdates();
  }, []);

  return (
    <>
      <AppRoutes />
      <Toaster position="top-right" />
    </>
  );
}
