const KEY = "lastlink-administrator-session";
export function adminToken(): string | null {
  return sessionStorage.getItem(KEY);
}
export function setAdminToken(token: string): void {
  sessionStorage.setItem(KEY, token);
}
export function clearAdminToken(): void {
  sessionStorage.removeItem(KEY);
}
export function isAdministrator(): boolean {
  return !!adminToken();
}
export function administratorHeaders(): Record<string, string> {
  const token = adminToken();
  return token ? { authorization: `Bearer ${token}` } : {};
}
