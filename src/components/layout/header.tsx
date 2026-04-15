import { useMatches } from "react-router-dom";

import clientLogo from "../../assets/clientLogo.png";
import iotelligenceLogo from "../../assets/LOGO.png";

import "../../app/globals.css";

const Navbar = () => {
	const matches = useMatches();

	const titleFromRoute =
		[...matches]
			.reverse()
			.map((match) => (match.handle as { label?: string } | undefined)?.label)
			.find((label): label is string => Boolean(label)) ??
		"MAINTENANCE 2.0 DASHBOARD";

	return (
		<header className="navbar sticky top-0 z-40">
			<div className="flex h-full w-full items-center justify-between gap-3 px-1">
				<div className="flex min-w-0 items-center gap-2">
					<div className="flex items-center justify-center rounded-xl border border-[rgba(30,64,175,0.16)] bg-white px-2 py-1 shadow-[0_10px_24px_rgba(2,6,23,0.16)]">
						<img
							src={clientLogo}
							alt="Customer Logo"
							className="h-8 w-auto object-contain md:h-7"
						/>
					</div>
				</div>

				<div className="flex flex-1 items-center justify-center">
					<h1
						className="
							font-headline
							text-xs md:text-sm
							font-bold
							tracking-[0.22em]
							text-[#eff6ff]
							text-center
							whitespace-nowrap
							drop-shadow-[0_1px_0_rgba(15,23,42,0.42)]
						"
					>
						{titleFromRoute}
					</h1>
				</div>

				{/* RIGHT: Solution provider logo */}
				<div className="flex items-center gap-2">
					<div className="flex items-center justify-center rounded-xl border border-[rgba(30,64,175,0.16)] bg-white px-2 py-1 shadow-[0_10px_24px_rgba(2,6,23,0.16)]">
						<img
							src={iotelligenceLogo}
							alt="Iotelligence Logo"
							className="h-8 w-auto object-contain md:h-7"
						/>
					</div>
				</div>
			</div>
		</header>
	);
};

export default Navbar;
