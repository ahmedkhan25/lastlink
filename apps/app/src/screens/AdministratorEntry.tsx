import { useEffect } from "react";
import { setAdminToken } from "../lib/administrator.js";
export function AdministratorEntry() {
  useEffect(() => {
    const token = window.location.hash.slice(1);
    if (token) setAdminToken(token);
    window.history.replaceState(null, "", "/administrator");
    window.location.replace("/dashboard");
  }, []);
  return <p style={{ padding: 40 }}>Opening account administration…</p>;
}
