import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import "./index.css";
import { ConfirmProvider } from "./components/ConfirmProvider.js";
import { AppLayout } from "./AppLayout.js";
import { Dashboard } from "./screens/Dashboard.js";
import { Onboarding } from "./screens/Onboarding.js";
import { Contacts } from "./screens/Contacts.js";
import { Compose } from "./screens/Compose.js";
import { Advocates } from "./screens/Advocates.js";
import { SignIn } from "./screens/SignIn.js";

const router = createBrowserRouter([
  { path: "/signin", element: <SignIn /> },
  { path: "/onboarding", element: <Onboarding /> },
  {
    path: "/",
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: "dashboard", element: <Dashboard /> },
      { path: "compose", element: <Compose /> },
      { path: "contacts", element: <Contacts /> },
      { path: "advocates", element: <Advocates /> },
    ],
  },
]);

// No StrictMode: its dev double-invoke double-acquires getUserMedia (camera).
createRoot(document.getElementById("root")!).render(
  <ConfirmProvider>
    <RouterProvider router={router} />
  </ConfirmProvider>,
);
