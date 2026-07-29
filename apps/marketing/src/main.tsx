import { createRoot } from "react-dom/client";
import "./index.css";
import { Marketing } from "./Marketing.js";
import { LegalPage } from "./LegalPage.js";
import { privacy } from "./legal/privacy.js";
import { terms } from "./legal/terms.js";

// Three static pages, no router dependency: render.yaml already rewrites /* to
// index.html, so reading the path once at boot is enough. Anything unrecognised
// falls through to the homepage.
const path = window.location.pathname.replace(/\/+$/, "") || "/";

const page =
  path === "/privacy" ? <LegalPage doc={privacy} other={{ href: "/terms", label: "Terms of Service" }} /> :
  path === "/terms"   ? <LegalPage doc={terms}   other={{ href: "/privacy", label: "Privacy Policy" }} /> :
  <Marketing />;

const title = path === "/privacy" ? privacy.meta.title : path === "/terms" ? terms.meta.title : null;
if (title) document.title = `LastLink — ${title}`;

createRoot(document.getElementById("root")!).render(page);
