import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import { Accept } from "./Accept.js";

const router = createBrowserRouter([
  { path: "/accept/:token", element: <Accept /> },
  { path: "*", element: <Accept /> },
]);

createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
