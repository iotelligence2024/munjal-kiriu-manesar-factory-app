import type { UserSession } from "./session";

export const MODULE_KEYS = [
	"travel_requisition",
	"travel_expense_statement",
	"digital_checksheet",
	"department_master",
	"checksheet_master",
	"role_master",
	"user_master",
	"activity_mapping",
] as const;

export type ModuleKey = (typeof MODULE_KEYS)[number];
export type ModuleAccessMap = Record<ModuleKey, boolean>;

const ADMIN_ROLE_NAME = "it admin";

export const DEFAULT_MODULE_ACCESS: ModuleAccessMap = {
	travel_requisition: false,
	travel_expense_statement: false,
	digital_checksheet: false,
	department_master: false,
	checksheet_master: false,
	role_master: false,
	user_master: false,
	activity_mapping: false,
};

export const UNAUTHORIZED_ALERT_KEY = "unauthorized_access_alerted";

const normalize = (value: string | undefined | null) => String(value ?? "").trim().toLowerCase();

export const isItAdmin = (
	session: Pick<UserSession, "role" | "department"> | null | undefined
) => {
	const normalizedRole = normalize(session?.role);
	const normalizedDepartment = normalize(session?.department);
	return normalizedRole === ADMIN_ROLE_NAME || (normalizedDepartment === "it" && normalizedRole === "admin");
};

export const normalizeModuleAccess = (raw: Partial<ModuleAccessMap> | null | undefined): ModuleAccessMap => ({
	travel_requisition: Boolean(raw?.travel_requisition),
	travel_expense_statement: Boolean(raw?.travel_expense_statement),
	digital_checksheet: Boolean(raw?.digital_checksheet),
	department_master: Boolean(raw?.department_master),
	checksheet_master: Boolean(raw?.checksheet_master),
	role_master: Boolean(raw?.role_master),
	user_master: Boolean(raw?.user_master),
	activity_mapping: Boolean(raw?.activity_mapping),
});

export const getUserModuleAccess = (session: UserSession | null | undefined): ModuleAccessMap => {
	if (!session) {
		return DEFAULT_MODULE_ACCESS;
	}
	if (isItAdmin(session)) {
		return MODULE_KEYS.reduce((acc, key) => {
			acc[key] = true;
			return acc;
		}, {} as ModuleAccessMap);
	}
	return normalizeModuleAccess(session.allowed_modules);
};

const routeModuleMap: Array<{ module: ModuleKey; patterns: RegExp[] }> = [
	{ module: "travel_requisition", patterns: [/^\/hr\/travel-requisition-form(?:\/|$)/i] },
	{ module: "travel_expense_statement", patterns: [/^\/hr\/travel-expense-statement(?:\/|$)/i] },
	{ module: "digital_checksheet", patterns: [/^\/quality(?:\/|$)/i] },
	{ module: "department_master", patterns: [/^\/admin\/department-master(?:\/|$)/i] },
	{ module: "checksheet_master", patterns: [/^\/admin\/checksheet-master(?:\/|$)/i] },
	{ module: "role_master", patterns: [/^\/admin\/role-master(?:\/|$)/i] },
	{ module: "user_master", patterns: [/^\/admin\/user-master(?:\/|$)/i] },
	{ module: "activity_mapping", patterns: [/^\/admin\/activity-mapping(?:\/|$)/i] },
];

export const isPathAuthorizedForSession = (
	session: UserSession | null | undefined,
	pathname: string
): boolean => {
	if (!session) {
		return false;
	}
	if (isItAdmin(session)) {
		return true;
	}

	const access = getUserModuleAccess(session);
	const normalizedPath = String(pathname || "/");

	if (normalizedPath === "/" || normalizedPath === "") {
		return true;
	}
	if (/^\/admin(?:\/|$)/i.test(normalizedPath) && normalizedPath.toLowerCase() === "/admin") {
		return (
			access.department_master ||
			access.checksheet_master ||
			access.role_master ||
			access.user_master ||
			access.activity_mapping
		);
	}
	if (/^\/quality(?:\/|$)/i.test(normalizedPath) && normalizedPath.toLowerCase() === "/quality") {
		return access.digital_checksheet;
	}

	const matched = routeModuleMap.find((entry) =>
		entry.patterns.some((pattern) => pattern.test(normalizedPath))
	);

	return matched ? access[matched.module] : true;
};

export const getDefaultAuthorizedPath = (session: UserSession | null | undefined): string => {
	if (!session) return "/login";
	if (isItAdmin(session)) return "/";

	const access = getUserModuleAccess(session);

	if (access.travel_requisition) return "/hr/travel-requisition-form";
	if (access.travel_expense_statement) return "/hr/travel-expense-statement";
	if (access.digital_checksheet) return "/quality/digital-checksheet";
	if (access.department_master) return "/admin/department-master";
	if (access.checksheet_master) return "/admin/checksheet-master";
	if (access.role_master) return "/admin/role-master";
	if (access.user_master) return "/admin/user-master";
	if (access.activity_mapping) return "/admin/activity-mapping";

	return "/";
};
