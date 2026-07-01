import { createRoot } from "react-dom/client";
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import { Message } from "./Message.js";

const router = createBrowserRouter([
  { path: "/m/:token", element: <Message /> },
  { path: "*", element: <Message /> },
]);

createRoot(document.getElementById("root")!).render(<RouterProvider router={router} />);
