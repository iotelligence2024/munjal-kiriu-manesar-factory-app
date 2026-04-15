'use client';

import './globals.css';
import { Outlet } from "react-router-dom";
import { Toaster } from '../components/ui/toaster';
import Footer from '../components/ui/footer';

import Header from '../components/layout/header';
import { ContentBackButton } from '../components/layout/content-back-button';
import { AppSidebar } from '../components/layout/sidebar';
import { RouteTransitionLoader } from '../components/layout/route-transition-loader';

import { SidebarProvider } from '../components/ui/sidebar';

export default function RootLayout({
	children,
}: {
	children?: React.ReactNode;
}) {
	const content = children ?? <Outlet />;

	return (
		<html lang="en">
			<head>
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<link rel="preconnect" href="https://fonts.googleapis.com" />
				<link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
				<link
					href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap"
					rel="stylesheet"
				/>
			</head>

			<body className="font-body antialiased">
				<SidebarProvider>
					<div className="relative min-h-screen overflow-hidden">
						<div className="dashboard-bg" />

						<div className="relative z-10 flex min-h-screen min-w-0">
							<AppSidebar />

							<div className="flex min-h-screen min-w-0 flex-1 flex-col">
								<Header />

								<main className="app-shell-main flex min-w-0 max-w-full flex-1 flex-col overflow-x-hidden overflow-y-auto">
									<ContentBackButton />
									{content}
								</main>

								<Footer />
							</div>
						</div>
					</div>

					<RouteTransitionLoader />
					<Toaster />
				</SidebarProvider>
			</body>
		</html>
	);
}
