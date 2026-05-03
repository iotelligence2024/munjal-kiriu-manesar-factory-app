import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Users, LogOut, ShieldCheck, BadgeCheck } from "lucide-preact";
import { clearSession } from "../../utils/session";
import { useSession } from "../../app/context/SessionContext";
import { getUserModuleAccess } from "../../utils/access-control";

import { Sidebar, SidebarContent, SidebarMenu, SidebarMenuItem, SidebarMenuButton } from "../../components/ui/sidebar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../components/ui/tooltip";

/* ---------------- NAV ITEMS ---------------- */
const navItems = [{
	href: "/",
	label: "HR",
	icon: Users,
}, {
	href: "/quality",
	label: "Quality",
	icon: BadgeCheck,
}, {
	href: "/admin",
	label: "Admin",
	icon: ShieldCheck,
}];

/* ---------------- COMPONENT ---------------- */
export function AppSidebar() {
	const { pathname } = useLocation();
	const navigate = useNavigate();
	const { setSessionState, session } = useSession();
	const [hovered, setHovered] = useState<string | null>(null);
	const moduleAccess = getUserModuleAccess(session);
	const filteredNavItems = navItems.filter((item) => {
		if (item.href === "/") {
			return moduleAccess.travel_requisition || moduleAccess.travel_expense_statement;
		}
		if (item.href === "/quality") {
			return moduleAccess.digital_checksheet;
		}
		if (item.href === "/admin") {
			return (
				moduleAccess.department_master ||
				moduleAccess.checksheet_master ||
				moduleAccess.role_master ||
				moduleAccess.user_master ||
				moduleAccess.activity_mapping
			);
		}
		return true;
	});

	const handleSignOut = () => {
		const ok = confirm("Sign out of the application?");
		if (!ok) return;

		clearSession();
		setSessionState(null);
		navigate("/login", { replace: true });
	};

	return (
		<TooltipProvider delayDuration={120}>
			<Sidebar
				className="
					app-shell-sidebar
					fixed
					items-center
					z-30

					h-auto

					rounded-[1.75rem]
					border border-[rgba(148,163,184,0.2)]
					bg-[linear-gradient(180deg,rgba(30,64,175,0.94),rgba(15,23,42,0.96),rgba(8,47,73,0.94))]
					shadow-[0_24px_50px_rgba(2,6,23,0.32)]

					py-4
					pointer-events-auto

					backdrop-blur-xl
				"
			>
				<SidebarContent
					className="
						flex flex-1 items-center justify-center
						p-2
						py-4

						max-h-full
						overflow-y-auto
						overscroll-contain

						[&::-webkit-scrollbar]:hidden
						[-ms-overflow-style:none]
						[scrollbar-width:none]
					"
				>
					<SidebarMenu className="flex w-full flex-col items-center justify-center gap-3">
						{filteredNavItems.map((item) => {
							const Icon = item.icon;
							const isActive =
								pathname === item.href ||
								pathname.startsWith(item.href + "/");

							const isOpen = hovered === item.href;

							return (
								<SidebarMenuItem key={item.href}>
									<Tooltip
										open={isOpen}
										onOpenChange={(open) =>
											setHovered(open ? item.href : null)
										}
									>
										{/* Keep tooltip open while pointer is on trigger */}
										<TooltipTrigger asChild>
											{/* attach mouse events to link so hover is captured */}
											<Link
												to={item.href}
												onMouseEnter={() => setHovered(item.href)}
												onMouseLeave={() => setHovered(null)}
											>
												<SidebarMenuButton
													data-active={isActive}
													variant="ghost"
													className="
														h-12 w-12
														flex items-center justify-center
														rounded-xl
														cursor-pointer

														text-[#dbeafe]
														hover:bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(103,232,249,0.12))]
														hover:text-white

														data-[active=true]:bg-[linear-gradient(135deg,rgba(255,255,255,0.2),rgba(34,211,238,0.18),rgba(45,212,191,0.16))]
														data-[active=true]:text-white
														data-[active=true]:shadow-[0_10px_20px_rgba(2,6,23,0.2)]

														transition-colors
													"
												>
													<Icon className="h-5 w-5" />
												</SidebarMenuButton>
											</Link>
										</TooltipTrigger>
										<TooltipContent
											side="right"
											align="center"
											onMouseEnter={() => setHovered(item.href)}
											onMouseLeave={() => setHovered(null)}
											className="
													ml-2
													rounded-md
													bg-[rgba(15,23,42,0.96)]
													border border-[rgba(148,163,184,0.18)]
													text-[#e2e8f0]
													px-3 py-1.5
													text-xs
													shadow-[0_12px_24px_rgba(2,6,23,0.32)]
													backdrop-blur

													z-[9999]
													pointer-events-auto
												"
										>
											{item.label}
										</TooltipContent>

									</Tooltip>
								</SidebarMenuItem>
							);
						})}

						<SidebarMenuItem key="sign-out">
							<Tooltip
								open={hovered === "sign-out"}
								onOpenChange={(open) =>
									setHovered(open ? "sign-out" : null)
								}
							>
								<TooltipTrigger asChild>
									<button
										type="button"
										onMouseEnter={() => setHovered("sign-out")}
										onMouseLeave={() => setHovered(null)}
										onClick={handleSignOut}
										className="cursor-pointer"
									>
										<SidebarMenuButton
											variant="ghost"
											className="
												h-12 w-12
												flex items-center justify-center
												rounded-xl

												text-[#dbeafe]
												hover:bg-[linear-gradient(135deg,rgba(255,255,255,0.14),rgba(103,232,249,0.12))]
												hover:text-white

												transition-colors
											"
										>
											<LogOut className="h-5 w-5" />
										</SidebarMenuButton>
									</button>
								</TooltipTrigger>

								<TooltipContent
									side="right"
									align="center"
									onMouseEnter={() => setHovered("sign-out")}
									onMouseLeave={() => setHovered(null)}
									className="
										ml-2
										rounded-md
										bg-[rgba(15,23,42,0.96)]
										border border-[rgba(148,163,184,0.18)]
										text-[#e2e8f0]
										px-3 py-1.5
										text-xs
										shadow-[0_12px_24px_rgba(2,6,23,0.32)]
										backdrop-blur

										z-[9999]
										pointer-events-auto
									"
								>
									Sign Out
								</TooltipContent>
							</Tooltip>
						</SidebarMenuItem>
					</SidebarMenu>
				</SidebarContent>
			</Sidebar>
		</TooltipProvider>
	);
}

