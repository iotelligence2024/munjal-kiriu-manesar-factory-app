"use client";

import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";

import { ScreenLoader } from "../ScreenLoader";

const ROUTE_MESSAGES: Array<{ prefix: string; message: string }> = [
	{ prefix: "/production/checksheets", message: "Opening Production checksheets..." },
	{ prefix: "/production", message: "Opening Production module..." },
	{ prefix: "/fixture-preventive-maintenance/checksheets", message: "Opening Fixture PM checksheets..." },
	{ prefix: "/fixture-preventive-maintenance", message: "Opening Fixture PM module..." },
	{ prefix: "/mould-preventive-maintenance/checksheets", message: "Opening Mould PM checksheets..." },
	{ prefix: "/mould-preventive-maintenance/deviations", message: "Opening Mould PM deviations..." },
	{ prefix: "/mould-preventive-maintenance", message: "Opening Mould PM module..." },
	{ prefix: "/mould-health/checksheets", message: "Opening Mould Health checksheets..." },
	{ prefix: "/mould-health/deviations", message: "Opening Mould Health deviations..." },
	{ prefix: "/mould-health", message: "Opening Mould Health module..." },
	{ prefix: "/master-data/checksheets", message: "Opening Master Data checksheets..." },
	{ prefix: "/master-data", message: "Opening Master Data module..." },
	{ prefix: "/spare", message: "Opening Spare module..." },
	{ prefix: "/breakdown", message: "Opening Downtime module..." },
	{ prefix: "/mould-history", message: "Opening Mould History module..." },
	{ prefix: "/", message: "Opening Dashboard..." },
];

const ROUTE_LOADER_DELAY_MS = 450;

function toTitleCase(value: string) {
	return value
		.split("-")
		.filter(Boolean)
		.map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
		.join(" ");
}

function getRouteLoaderMessage(pathname: string) {
	const matchedRoute = ROUTE_MESSAGES.find(({ prefix }) => pathname === prefix || pathname.startsWith(`${prefix}/`));
	if (matchedRoute) {
		return matchedRoute.message;
	}

	const finalSegment = pathname.split("/").filter(Boolean).pop();
	return finalSegment ? `Opening ${toTitleCase(finalSegment)}...` : "Opening Module...";
}

export function RouteTransitionLoader() {
	const location = useLocation();
	const [loadingMessage, setLoadingMessage] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const isFirstRender = useRef(true);
	const hideTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	useEffect(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}

		setLoadingMessage(getRouteLoaderMessage(location.pathname));
		setIsLoading(true);

		if (hideTimeoutRef.current) {
			clearTimeout(hideTimeoutRef.current);
		}

		hideTimeoutRef.current = setTimeout(() => {
			setIsLoading(false);
		}, ROUTE_LOADER_DELAY_MS);
	}, [location.key, location.pathname]);

	useEffect(() => {
		return () => {
			if (hideTimeoutRef.current) {
				clearTimeout(hideTimeoutRef.current);
			}
		};
	}, []);

	if (!isLoading) {
		return null;
	}

	return <ScreenLoader message={loadingMessage} />;
}
