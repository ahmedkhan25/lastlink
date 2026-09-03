import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import { Memorial } from "./Memorial.js";
import { BrowseMemorials } from "./BrowseMemorials.js";

const router = createBrowserRouter([
  { path: "/", element: <BrowseMemorials /> },
  { path: "/search", element: <BrowseMemorials /> },
  { path: "/:slug", element: <Memorial /> },
  { path: "*", element: <BrowseMemorials /> },
]);

createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
