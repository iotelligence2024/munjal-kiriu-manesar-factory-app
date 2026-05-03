// src/routes/ProtectedRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "../app/context/SessionContext";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { getDefaultAuthorizedPath, isPathAuthorizedForSession, UNAUTHORIZED_ALERT_KEY } from "../utils/access-control";

const POST_LOGIN_REDIRECT_KEY = "post_login_redirect";

export default function ProtectedRoute({
    children,
}: {
    children: ReactNode;
}) {
    const { session } = useSession();
    const location = useLocation();
    const isUnauthorizedForPath = Boolean(session) && !isPathAuthorizedForSession(session, location.pathname);

    useEffect(() => {
        if (!isUnauthorizedForPath || typeof window === "undefined") {
            return;
        }
        if (!sessionStorage.getItem(UNAUTHORIZED_ALERT_KEY)) {
            window.alert("Unauthorized acccess");
            sessionStorage.setItem(UNAUTHORIZED_ALERT_KEY, "1");
        }
    }, [isUnauthorizedForPath]);

    if (!session) {
        const redirectPath = `${location.pathname}${location.search}${location.hash}`;

        if (typeof window !== "undefined" && redirectPath !== "/login") {
            sessionStorage.setItem(POST_LOGIN_REDIRECT_KEY, redirectPath);
        }

        return (
            <Navigate
                to="/login"
                replace
                state={{
                    from: {
                        pathname: location.pathname,
                        search: location.search,
                        hash: location.hash,
                    },
                }}
            />
        );
    }

    const defaultAuthorizedPath = getDefaultAuthorizedPath(session);
    if (location.pathname === "/" && defaultAuthorizedPath !== "/") {
        return <Navigate to={defaultAuthorizedPath} replace />;
    }

    if (isUnauthorizedForPath) {
        return (
            <Navigate
                to={defaultAuthorizedPath}
                replace
                state={{
                    unauthorized: true,
                    unauthorizedMessage: "Unauthorized acccess",
                }}
            />
        );
    }

    return <>{children}</>;
}
