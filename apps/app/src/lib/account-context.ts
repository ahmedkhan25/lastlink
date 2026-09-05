import { createContext, useContext } from "react";
import type { AccountStatus } from "@lastlink/shared";
export interface AccountContextValue {
  status: AccountStatus;
  administrator: { name: string; role: string } | null;
}
export const AccountContext = createContext<AccountContextValue | null>(null);
export function useAccountContext(): AccountContextValue | null {
  return useContext(AccountContext);
}
