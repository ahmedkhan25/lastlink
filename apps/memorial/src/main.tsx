import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import { Memorial } from "./Memorial.js";

// Public memorial page. In production this resolves a slug (memorial.lastlink.com/:slug);
// here it renders a representative memorial from local fixtures (preview — no backend).
const router = createBrowserRouter([
  { path: "/:slug", element: <Memorial /> },
  { path: "*", element: <Memorial /> },
]);

createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
