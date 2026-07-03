import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import { Accept } from "./Accept.js";
import { Confirm } from "./Confirm.js";
import { Landing } from "./Landing.js";

const router = createBrowserRouter([
  { path: "/", element: <Landing /> },
  { path: "/accept/:token", element: <Accept /> },
  { path: "/confirm/:token", element: <Confirm /> },
  { path: "*", element: <Landing /> },
]);

createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
