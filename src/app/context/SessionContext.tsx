import { createContext, useContext, useState } from "react";
import { getSession } from "../../utils/session";
import type { UserSession } from "../../utils/session";

const SessionContext = createContext<{
	session: UserSession | null;
	setSessionState: (s: UserSession | null) => void;
}>({
	session: null,
	setSessionState: () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
	const [session, setSessionState] = useState<UserSession | null>(() =>
		getSession()
	);

	return (
		<SessionContext.Provider value={{ session, setSessionState }}>
			{children}
		</SessionContext.Provider>
	);
}

export const useSession = () => useContext(SessionContext);
