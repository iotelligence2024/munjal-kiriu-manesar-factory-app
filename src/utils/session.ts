export type UserSession = {
    username: string;
    employee_code: string;
    employee_name: string;
    department: string;
    role: string;
};

const SESSION_KEY = "user_session";

export const setSession = (data: UserSession) => {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(data));
};

export const getSession = (): UserSession | null => {
    const raw = sessionStorage.getItem(SESSION_KEY);
    return raw ? JSON.parse(raw) : null;
};

export const clearSession = () => {
    sessionStorage.removeItem(SESSION_KEY);
};

export const isLoggedIn = (): boolean => {
    return !!getSession();
};
