// src/routes/ProtectedRoute.tsx
import { Navigate, useLocation } from "react-router-dom";
import { useSession } from "../app/context/SessionContext";
import type { ReactNode } from "react";

const POST_LOGIN_REDIRECT_KEY = "post_login_redirect";

export default function ProtectedRoute({
    children,
}: {
    children: ReactNode;
}) {
    const { session } = useSession();
    const location = useLocation();

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

    return <>{children}</>;
}
