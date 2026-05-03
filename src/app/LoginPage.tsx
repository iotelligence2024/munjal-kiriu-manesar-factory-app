import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
	// Activity,
	// AlertTriangle,
	ArrowRight,
	// CalendarCheck,
	// Factory,
	// Package,
	// Wrench,
} from "lucide-preact";

import { Button } from "../components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import {
	Dialog,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../components/ui/select";
import clientLogo from "../assets/clientLogo.png";
import { useSession } from "./context/SessionContext";
import { setSession } from "../utils/session";
import { getDefaultAuthorizedPath, isPathAuthorizedForSession, UNAUTHORIZED_ALERT_KEY } from "../utils/access-control";

// const moduleHighlights = [
// 	{ label: "Digital Checksheets", icon: CalendarCheck },
// 	{ label: "Maintenance", icon: Wrench },
// 	{ label: "Production Monitoring", icon: Factory },
// 	{ label: "Machine Health", icon: Activity },
// 	{ label: "Inventory & Spares", icon: Package },
// 	{ label: "Downtime Tracking", icon: AlertTriangle },
// ];

const glassCardClassName =
	"dashboard-glass relative overflow-hidden rounded-[1.8rem] border border-[rgba(30,64,175,0.16)] shadow-[0_24px_64px_rgba(15,23,42,0.1)]";

const fieldShellClassName =
	"overflow-hidden rounded-[1.1rem] border border-[rgba(15,23,42,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.97),rgba(245,247,250,0.94))] px-4";

const loginInputClassName =
	"h-12 !rounded-none !border-0 !bg-transparent px-0 text-sm text-[#17181d] placeholder:text-[#97a0ab] !shadow-none outline-none !ring-0 focus:!border-0 focus:!bg-transparent focus:outline-none focus:!ring-0 focus:!shadow-none focus-visible:outline-none focus-visible:!ring-0 focus-visible:ring-offset-0 focus-visible:!shadow-none disabled:!bg-transparent disabled:!shadow-none autofill:!border-0 autofill:!bg-transparent autofill:shadow-[inset_0_0_0px_1000px_transparent] autofill:[-webkit-text-fill-color:#17181d]";

const secondaryActionButtonClassName =
	"h-11 w-full rounded-[1rem] border border-[rgba(30,64,175,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(232,240,250,0.86))] text-[#1e3a8a] shadow-[inset_0_1px_0_rgba(255,255,255,0.92),0_10px_20px_rgba(15,23,42,0.06)] transition-[background-color,border-color,color,transform,box-shadow] hover:border-[rgba(30,64,175,0.28)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(226,236,249,0.96))] hover:text-[#1e3a8a] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_14px_28px_rgba(30,64,175,0.12)] focus-visible:ring-[rgba(30,64,175,0.28)]";

const signupDialogClassName =
	"max-h-[calc(100vh-2rem)] overflow-hidden border-[rgba(30,64,175,0.16)] bg-[linear-gradient(180deg,rgba(252,253,255,0.98),rgba(235,243,251,0.98))] p-0 shadow-[0_30px_80px_rgba(15,23,42,0.2)] sm:max-w-[min(92vw,52rem)]";

const signupSectionClassName =
	"rounded-[1.2rem] border border-[rgba(59,130,246,0.12)] bg-[linear-gradient(180deg,rgba(255,255,255,0.92),rgba(232,240,250,0.82))] p-3 sm:p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.92)]";

const signupInputShellClassName =
	"overflow-hidden rounded-[1rem] border border-[rgba(15,23,42,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(245,247,250,0.9))] px-4";

const signupInputClassName =
	"h-10 sm:h-11 !rounded-none !border-0 !bg-transparent px-0 text-sm text-[#17181d] placeholder:text-[#8c98a8] !shadow-none outline-none !ring-0 focus:!bg-transparent focus:outline-none focus:!ring-0 focus:!border-0 focus:!shadow-none focus-visible:outline-none focus-visible:!ring-0 focus-visible:ring-offset-0 focus-visible:!shadow-none";

const POST_LOGIN_REDIRECT_KEY = "post_login_redirect";
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:54321";

type SignupForm = {
	employeeName: string;
	employeeCode: string;
	department: string;
	role: string;
	email: string;
	mobileNumber: string;
	username: string;
	password: string;
};

type MasterItem = {
	id: string;
	name: string;
};

const flatInputStyle = {
	border: "none",
	outline: "none",
	boxShadow: "none",
	WebkitBoxShadow: "none",
};

export default function LoginPage() {
	const navigate = useNavigate();
	const location = useLocation();
	const { setSessionState } = useSession();

	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState<string | null>(null);
	const [loading, setLoading] = useState(false);
	const [signupOpen, setSignupOpen] = useState(false);
	const [signupLoading, setSignupLoading] = useState(false);
	const [signupError, setSignupError] = useState<string | null>(null);
	const [signupSuccess, setSignupSuccess] = useState<string | null>(null);
	const [departmentOptions, setDepartmentOptions] = useState<MasterItem[]>([]);
	const [roleOptions, setRoleOptions] = useState<MasterItem[]>([]);
	const [signupForm, setSignupForm] = useState<SignupForm>({
		employeeName: "",
		employeeCode: "",
		department: "",
		role: "",
		email: "",
		mobileNumber: "",
		username: "",
		password: "",
	});

	useEffect(() => {
		const state = location.state as { unauthorized?: boolean; unauthorizedMessage?: string } | undefined;
		if (location.pathname === "/login" && state?.unauthorized && typeof window !== "undefined") {
			window.alert(state.unauthorizedMessage ?? "Unauthorized access");
			sessionStorage.removeItem(UNAUTHORIZED_ALERT_KEY);
			navigate("/login", { replace: true });
		}
	}, [location.pathname, location.state, navigate]);

	useEffect(() => {
		const loadMasterOptions = async () => {
			try {
				const [departmentResponse, roleResponse] = await Promise.all([
					fetch(`${API_BASE_URL}/api/department-master`),
					fetch(`${API_BASE_URL}/api/role-master`),
				]);

				const [departmentPayload, rolePayload] = await Promise.all([
					departmentResponse.json().catch(() => null),
					roleResponse.json().catch(() => null),
				]);

				if (departmentResponse.ok) {
					setDepartmentOptions(Array.isArray(departmentPayload?.items) ? departmentPayload.items : []);
				}

				if (roleResponse.ok) {
					setRoleOptions(Array.isArray(rolePayload?.items) ? rolePayload.items : []);
				}
			} catch {
				setDepartmentOptions([]);
				setRoleOptions([]);
			}
		};

		void loadMasterOptions();
	}, []);

	const getRedirectPath = () => {
		const navigationState = location.state as
			| {
				from?: {
					pathname?: string;
					search?: string;
					hash?: string;
				};
			}
			| undefined;

		const stateRedirect = navigationState?.from
			? `${navigationState.from.pathname ?? ""}${navigationState.from.search ?? ""}${navigationState.from.hash ?? ""}`
			: "";
		const storedRedirect =
			typeof window !== "undefined"
				? sessionStorage.getItem(POST_LOGIN_REDIRECT_KEY) ?? ""
				: "";

		const redirectPath = stateRedirect || storedRedirect;

		if (!redirectPath || redirectPath === "/login" || !redirectPath.startsWith("/")) {
			return "/";
		}

		return redirectPath;
	};

	const updateSignupField = (field: keyof SignupForm, value: string) => {
		setSignupForm((current) => ({
			...current,
			[field]: value,
		}));
		if (signupError) {
			setSignupError(null);
		}
	};

	const resetSignupState = () => {
		setSignupForm({
			employeeName: "",
			employeeCode: "",
			department: "",
			role: "",
			email: "",
			mobileNumber: "",
			username: username.trim(),
			password: "",
		});
		setSignupError(null);
		setSignupSuccess(null);
	};

	const openSignupModal = () => {
		resetSignupState();
		setSignupOpen(true);
	};

	const handleLogin = async (e?: React.FormEvent) => {
		e?.preventDefault();

		try {
			setLoading(true);
			setError(null);

			const res = await fetch(`${API_BASE_URL}/api/login`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ username, password }),
			});

			if (!res.ok) {
				const payload = await res.json().catch(() => null);
				if (res.status === 404) {
					setSignupForm((current) => ({
						...current,
						username: username.trim().toLowerCase(),
						password,
					}));
					setSignupOpen(true);
				}

				throw new Error(payload?.message ?? "Invalid username or password");
			}

			const data = await res.json();
			const sessionData = {
				username: data.username,
				employee_code: data.employee_code,
				department: data.department,
				role: data.role,
				employee_name: data.employee_name,
				allowed_modules: data.allowed_modules ?? undefined,
			};

			setSession(sessionData);
			setSessionState(sessionData);

			if (typeof window !== "undefined") {
				sessionStorage.removeItem(POST_LOGIN_REDIRECT_KEY);
			}

			const preferredRedirectPath = getRedirectPath();
			const nextPath =
				preferredRedirectPath === "/"
					? getDefaultAuthorizedPath(sessionData)
					: isPathAuthorizedForSession(sessionData, preferredRedirectPath)
						? preferredRedirectPath
						: getDefaultAuthorizedPath(sessionData);
			navigate(nextPath, { replace: true });
		} catch (err) {
			setError(
				err instanceof TypeError
					? "Authentication server is not reachable. Start the backend and try again."
					: err instanceof Error
						? err.message
						: "Login failed"
			);
		} finally {
			setLoading(false);
		}
	};

	const handleSignup = async (e?: React.FormEvent) => {
		e?.preventDefault();

		try {
			setSignupLoading(true);
			setSignupError(null);
			setSignupSuccess(null);

			const res = await fetch(`${API_BASE_URL}/api/signup`, {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(signupForm),
			});

			const payload = await res.json().catch(() => null);

			if (!res.ok) {
				throw new Error(payload?.message ?? "Unable to submit signup request.");
			}

			setUsername(signupForm.username.trim().toLowerCase());
			setPassword("");
			setSignupSuccess(payload?.message ?? "Signup request submitted.");
		} catch (err) {
			setSignupError(
				err instanceof TypeError
					? "Authentication server is not reachable. Start the backend and try again."
					: err instanceof Error
						? err.message
						: "Unable to submit signup request."
			);
		} finally {
			setSignupLoading(false);
		}
	};

	return (
		<>
			<div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#fbfdff_0%,#edf4fb_52%,#dbe7f5_100%)] px-4 py-6 sm:px-6 lg:px-8">
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(30,64,175,0.18),transparent_28%),radial-gradient(circle_at_left_30%,rgba(8,145,178,0.14),transparent_22%),linear-gradient(135deg,rgba(255,255,255,0.34),transparent_54%)]" />
				<div className="pointer-events-none absolute left-[-8rem] top-16 h-56 w-56 rounded-full bg-[rgba(30,64,175,0.08)] blur-3xl" />
				<div className="pointer-events-none absolute bottom-12 right-[-4rem] h-72 w-72 rounded-full bg-[rgba(8,145,178,0.16)] blur-3xl" />

				<div className="relative mx-auto flex min-h-[calc(100vh-3rem)] max-w-6xl items-center justify-center">
					<div className="grid w-full max-w-5xl gap-5 lg:grid-cols-[1.08fr_0.92fr]">
						<Card className={glassCardClassName}>
							<div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,rgba(30,64,175,0.92),rgba(2,132,199,0.84),rgba(13,148,136,0.78))]" />
							<CardContent className="relative flex h-full flex-col justify-between gap-8 p-6 sm:p-8">
								<div className="space-y-7 my-3">

									<div className="space-y-5">
										<div className="inline-flex items-center justify-center rounded-[1.2rem] border border-[rgba(30,64,175,0.14)] bg-white px-5 py-3 shadow-[0_12px_24px_rgba(15,23,42,0.08)]">
											<img
												src={clientLogo}
												alt="Subros Logo"
												className="h-12 w-auto object-contain sm:h-14"
											/>
										</div>

										<div className="max-w-xl space-y-3">
											<h1
												className="text-3xl font-semibold tracking-[-0.03em] text-[#17181d] sm:text-4xl"
												style={{ fontFamily: "\"Space Grotesk\", sans-serif" }}
											>
												One connected IIoT dashboard for factory operations, quality and approvals.
											</h1>
											<p className="max-w-lg text-sm leading-6 text-[#5f6772] sm:text-base">
												Monitor production activity, manage digital checksheets, track downtime, and keep plant teams aligned through a single secure sign-in.
											</p>
										</div>
									</div>

									{/* <div className="grid gap-3 sm:grid-cols-2">
										{moduleHighlights.map(({ label, icon: Icon }) => (
											<div
												key={label}
												className="rounded-[1.1rem] border border-[rgba(59,130,246,0.14)] bg-[linear-gradient(180deg,rgba(255,255,255,0.95),rgba(231,239,250,0.92))] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.84)]"
											>
												<div className="flex items-center gap-3">
													<div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,rgba(30,64,175,0.14),rgba(8,145,178,0.2))] text-[#1d4ed8]">
														<Icon className="h-4 w-4" />
													</div>
													<div>
														<div className="text-sm font-semibold text-[#1f2430]">{label}</div>
													</div>
												</div>
											</div>
										))}
									</div> */}
								</div>
							</CardContent>
						</Card>

						<Card className={glassCardClassName}>
							<div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,rgba(30,64,175,0.92),rgba(2,132,199,0.84),rgba(13,148,136,0.78))]" />
							<CardHeader className="relative border-b border-[rgba(30,64,175,0.12)] bg-[linear-gradient(180deg,rgba(248,250,255,0.96),rgba(226,236,249,0.82))] p-6 sm:p-7">
								<CardTitle
									className="pt-3 text-3xl tracking-[-0.03em] text-[#17181d]"
									style={{ fontFamily: "\"Space Grotesk\", sans-serif" }}
								>
									Sign in
								</CardTitle>
								<p className="mt-2 text-sm text-[#5f6772]">
									Access your factory dashboard workspace with your assigned username and password.
								</p>
							</CardHeader>

							<form onSubmit={handleLogin} className="relative">
								<CardContent className="space-y-5 p-6 sm:p-7">
									<div className="space-y-2">
										<Label className="text-sm font-medium text-[#4d5560]">Username</Label>
										<div className={fieldShellClassName}>
											<Input
												value={username}
												onChange={(e) => {
													setUsername(e.currentTarget.value);
													if (error) {
														setError(null);
													}
												}}
												placeholder="Enter username"
												autoComplete="username"
												disabled={loading}
												className={loginInputClassName}
												style={flatInputStyle}
											/>
										</div>
									</div>

									<div className="space-y-2">
										<Label className="text-sm font-medium text-[#4d5560]">Password</Label>
										<div className={fieldShellClassName}>
											<Input
												type="password"
												value={password}
												onChange={(e) => {
													setPassword(e.currentTarget.value);
													if (error) {
														setError(null);
													}
												}}
												placeholder="Enter password"
												autoComplete="current-password"
												disabled={loading}
												className={loginInputClassName}
												style={flatInputStyle}
											/>
										</div>
									</div>

									{error && (
										<div className="rounded-[1rem] border border-[rgba(220,38,38,0.2)] bg-[rgba(248,113,113,0.14)] px-4 py-3 text-sm text-[#b91c1c]">
											{error}
										</div>
									)}
								</CardContent>

								<CardFooter className="flex flex-col gap-4 p-6 pt-0 sm:p-7 sm:pt-0">
									<Button
										type="submit"
										disabled={loading || !username.trim() || !password}
										className="h-12 w-full rounded-[1.1rem] border border-[rgba(30,64,175,0.16)] bg-[linear-gradient(135deg,#1e40af,#0284c7,#0f766e)] text-white shadow-[0_14px_28px_rgba(30,64,175,0.22)] hover:bg-[linear-gradient(135deg,#1d3a9a,#0369a1,#115e59)] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 disabled:hover:shadow-[0_14px_28px_rgba(30,64,175,0.22)]"
									>
										{loading ? (
											<span className="inline-flex items-center gap-2">
												<span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
												Signing in...
											</span>
										) : (
											<span className="inline-flex items-center gap-2">
												Open IIoT Dashboard
												<ArrowRight className="h-4 w-4" />
											</span>
										)}
									</Button>

									<Button
										type="button"
										variant="outline"
										onClick={openSignupModal}
										className={secondaryActionButtonClassName}
									>
										Request New Account
									</Button>
								</CardFooter>
							</form>
						</Card>
					</div>
				</div>
			</div>

			<Dialog
				open={signupOpen}
				onOpenChange={(nextOpen) => {
					setSignupOpen(nextOpen);
					if (nextOpen) {
						resetSignupState();
					}
				}}
			>
				<DialogContent className={signupDialogClassName}>
					<div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,rgba(30,64,175,0.92),rgba(2,132,199,0.84),rgba(13,148,136,0.78))]" />
					<div className="pointer-events-none absolute right-[-3rem] top-[-3rem] h-32 w-32 rounded-full bg-[rgba(30,64,175,0.12)] blur-3xl" />
					<div className="pointer-events-none absolute bottom-[-2rem] left-[-2rem] h-28 w-28 rounded-full bg-[rgba(8,145,178,0.14)] blur-3xl" />

					<DialogHeader className="border-b border-[rgba(30,64,175,0.1)] bg-[linear-gradient(180deg,rgba(248,250,255,0.96),rgba(226,236,249,0.84))] px-6 py-6 sm:px-7">
						<DialogTitle
							className="pt-3 text-2xl tracking-[-0.03em] text-[#17181d]"
							style={{ fontFamily: "\"Space Grotesk\", sans-serif" }}
						>
							Create your user master entry
						</DialogTitle>
					</DialogHeader>

					<form onSubmit={handleSignup} className="flex max-h-[calc(100vh-10rem)] flex-col gap-4 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
						<div className={signupSectionClassName}>
							<div className="mb-3">
								<p className="text-sm font-semibold text-[#1f2937]">User details</p>
								<p className="mt-1 text-xs text-[#64748b]">Fill all required information here to create your account request.</p>
							</div>

							<div className="grid gap-3 sm:grid-cols-2">
								<div className="space-y-2">
									<Label className="text-sm font-medium text-[#4d5560]">Employee Name</Label>
									<div className={signupInputShellClassName}>
										<Input
											value={signupForm.employeeName}
											onChange={(e) => updateSignupField("employeeName", e.currentTarget.value)}
											placeholder="Enter employee name"
											disabled={signupLoading}
											className={signupInputClassName}
											style={flatInputStyle}
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label className="text-sm font-medium text-[#4d5560]">Employee Code</Label>
									<div className={signupInputShellClassName}>
										<Input
											value={signupForm.employeeCode}
											onChange={(e) => updateSignupField("employeeCode", e.currentTarget.value)}
											placeholder="Enter employee code"
											disabled={signupLoading}
											className={signupInputClassName}
											style={flatInputStyle}
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label className="text-sm font-medium text-[#4d5560]">Department</Label>
									<div className={signupInputShellClassName}>
										<Select
											value={signupForm.department}
											onValueChange={(value) => updateSignupField("department", value)}
											disabled={signupLoading || departmentOptions.length === 0}
										>
											<SelectTrigger
												className="h-10 sm:h-11 border-0 bg-transparent px-0 text-sm text-[#17181d] shadow-none focus:ring-0 focus:ring-offset-0"
											>
												<SelectValue
													placeholder={
														departmentOptions.length === 0
															? "No departments available"
															: "Select department"
													}
												/>
											</SelectTrigger>
											<SelectContent>
												{departmentOptions.map((item) => (
													<SelectItem key={item.id} value={item.name}>
														{item.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="space-y-2">
									<Label className="text-sm font-medium text-[#4d5560]">Role</Label>
									<div className={signupInputShellClassName}>
										<Select
											value={signupForm.role}
											onValueChange={(value) => updateSignupField("role", value)}
											disabled={signupLoading || roleOptions.length === 0}
										>
											<SelectTrigger
												className="h-10 sm:h-11 border-0 bg-transparent px-0 text-sm text-[#17181d] shadow-none focus:ring-0 focus:ring-offset-0"
											>
												<SelectValue
													placeholder={
														roleOptions.length === 0
															? "No roles available"
															: "Select role"
													}
												/>
											</SelectTrigger>
											<SelectContent>
												{roleOptions.map((item) => (
													<SelectItem key={item.id} value={item.name}>
														{item.name}
													</SelectItem>
												))}
											</SelectContent>
										</Select>
									</div>
								</div>

								<div className="space-y-2">
									<Label className="text-sm font-medium text-[#4d5560]">Email</Label>
									<div className={signupInputShellClassName}>
										<Input
											type="email"
											value={signupForm.email}
											onChange={(e) => updateSignupField("email", e.currentTarget.value)}
											placeholder="Enter email address"
											disabled={signupLoading}
											className={signupInputClassName}
											style={flatInputStyle}
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label className="text-sm font-medium text-[#4d5560]">Mobile Number</Label>
									<div className={signupInputShellClassName}>
										<Input
											value={signupForm.mobileNumber}
											onChange={(e) => updateSignupField("mobileNumber", e.currentTarget.value)}
											placeholder="Enter mobile number"
											disabled={signupLoading}
											className={signupInputClassName}
											style={flatInputStyle}
										/>
									</div>
								</div>
								<div className="space-y-2">
									<Label className="text-sm font-medium text-[#4d5560]">Username</Label>
									<div className={signupInputShellClassName}>
										<Input
											value={signupForm.username}
											onChange={(e) => updateSignupField("username", e.currentTarget.value)}
											placeholder="Choose username"
											disabled={signupLoading}
											className={signupInputClassName}
											style={flatInputStyle}
										/>
									</div>
								</div>

								<div className="space-y-2">
									<Label className="text-sm font-medium text-[#4d5560]">Password</Label>
									<div className={signupInputShellClassName}>
										<Input
											type="password"
											value={signupForm.password}
											onChange={(e) => updateSignupField("password", e.currentTarget.value)}
											placeholder="Choose password"
											disabled={signupLoading}
											className={signupInputClassName}
											style={flatInputStyle}
										/>
									</div>
								</div>
							</div>
						</div>

						{signupError && (
							<div className="rounded-[1rem] border border-[rgba(220,38,38,0.2)] bg-[linear-gradient(180deg,rgba(254,242,242,0.96),rgba(254,226,226,0.86))] px-4 py-3 text-sm text-[#b91c1c] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
								{signupError}
							</div>
						)}

						{signupSuccess && (
							<div className="rounded-[1rem] border border-[rgba(5,150,105,0.2)] bg-[linear-gradient(180deg,rgba(236,253,245,0.96),rgba(209,250,229,0.82))] px-4 py-3 text-sm text-[#047857] shadow-[inset_0_1px_0_rgba(255,255,255,0.8)]">
								{signupSuccess}
							</div>
						)}

						<DialogFooter className="border-t border-[rgba(30,64,175,0.1)] bg-[linear-gradient(180deg,rgba(248,250,255,0.6),rgba(232,240,250,0.82))] px-0 pt-5">
							<Button
								type="button"
								variant="outline"
								onClick={() => setSignupOpen(false)}
								disabled={signupLoading}
								className="rounded-[1rem] border border-[rgba(30,64,175,0.18)] bg-[linear-gradient(180deg,rgba(255,255,255,0.94),rgba(231,239,250,0.9))] text-[#1e3a8a] shadow-[inset_0_1px_0_rgba(255,255,255,0.95),0_10px_20px_rgba(15,23,42,0.06)] transition-[background-color,border-color,color,box-shadow] hover:border-[rgba(30,64,175,0.28)] hover:bg-[linear-gradient(180deg,rgba(255,255,255,1),rgba(226,236,249,0.96))] hover:text-[#1d4ed8] hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.96),0_14px_28px_rgba(30,64,175,0.1)]"
							>
								Close
							</Button>
							<Button
								type="submit"
								disabled={
									signupLoading ||
									!signupForm.employeeName.trim() ||
									!signupForm.employeeCode.trim() ||
									!signupForm.department.trim() ||
									!signupForm.role.trim() ||
									!signupForm.email.trim() ||
									!signupForm.mobileNumber.trim() ||
									!signupForm.username.trim() ||
									!signupForm.password
								}
								className="rounded-[1rem] border border-[rgba(30,64,175,0.16)] bg-[linear-gradient(135deg,#1e40af,#0284c7,#0f766e)] px-6 text-white shadow-[0_14px_28px_rgba(30,64,175,0.22)] hover:bg-[linear-gradient(135deg,#1d3a9a,#0369a1,#115e59)]"
							>
								{signupLoading ? "Submitting..." : "Create request"}
							</Button>
						</DialogFooter>
					</form>
				</DialogContent>
			</Dialog>
		</>
	);
}
