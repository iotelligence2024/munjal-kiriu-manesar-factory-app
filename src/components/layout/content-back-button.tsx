"use client";

import { ArrowLeft } from "lucide-preact";
import { useLocation, useNavigate } from "react-router-dom";

export function ContentBackButton() {
	const { pathname } = useLocation();
	const navigate = useNavigate();

	if (pathname === "/") {
		return null;
	}

	const handleBack = () => {
		const historyIndex = window.history.state?.idx;

		if (typeof historyIndex === "number" && historyIndex > 0) {
			navigate(-1);
			return;
		}

		navigate("/");
	};

	return (
		<button
			type="button"
			onClick={handleBack}
			className="content-back-button"
			aria-label="Go back"
		>
			<ArrowLeft size={15} />
			<span className="hidden md:inline">Back</span>
		</button>
	);
}
