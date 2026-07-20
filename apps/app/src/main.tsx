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
import { MessageView } from "./screens/MessageView.js";
import { SignIn } from "./screens/SignIn.js";
import { ImportContacts } from "./screens/preview/ImportContacts.js";
import { Condolences } from "./screens/preview/Condolences.js";
import { MemorialSettings } from "./screens/preview/MemorialSettings.js";
import { PlanBilling } from "./screens/preview/PlanBilling.js";
import { Profile } from "./screens/preview/Profile.js";

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
      { path: "messages/:id", element: <MessageView /> },
      { path: "contacts", element: <Contacts /> },
      { path: "contacts/import", element: <ImportContacts /> },
      { path: "advocates", element: <Advocates /> },
      // Preview screens — presentational stand-ins for designed-but-unbuilt
      // features (see docs/INVESTOR-DEMO-PLAN.md). No backend calls.
      { path: "memorial/settings", element: <MemorialSettings /> },
      { path: "condolences", element: <Condolences /> },
      { path: "account/plan", element: <PlanBilling /> },
      { path: "account/profile", element: <Profile /> },
    ],
  },
]);

// No StrictMode: its dev double-invoke double-acquires getUserMedia (camera).
createRoot(document.getElementById("root")!).render(
  <ConfirmProvider>
    <RouterProvider router={router} />
  </ConfirmProvider>,
);
