import { useEffect, useState } from "react";
import "../../app/globals.css";

const Footer = () => {
	const currentYear = new Date().getFullYear();

	const formatLocalDateTime = (dateInput: string | number | Date) => {
		const d = new Date(dateInput);
		const pad = (n: number) => n.toString().padStart(2, "0");

		const day = pad(d.getDate());
		const month = pad(d.getMonth() + 1);
		const year = d.getFullYear();
		const hours = pad(d.getHours());
		const minutes = pad(d.getMinutes());
		const seconds = pad(d.getSeconds());

		return `${day}-${month}-${year} ${hours}:${minutes}:${seconds}`;
	};

	const [date, setDate] = useState<string>(formatLocalDateTime(new Date()));

	useEffect(() => {
		const interval = setInterval(() => {
			setDate(formatLocalDateTime(new Date()));
		}, 1000);

		return () => clearInterval(interval);
	}, []);

	return (
		<footer className="footer">
			<div className="footer-left footer-mobile-copy">
				<span className="font-semibold text-slate-100">
					Developed by Iotelligence Private Limited
				</span>{" "}
				|{" "}
				<a className="footer-link" href="tel:+919158151405">
					+91 9158151405
				</a>{" "}
				|{" "}
				<a className="footer-link" href="mailto:info@iotelligence.in">
					info@iotelligence.in
				</a>{" "}
				| {currentYear}
			</div>

			<div className="footer-right footer-desktop-time font-medium text-slate-300 md:ml-auto">
				<div>{date}</div>
			</div>
		</footer>
	);
};

export default Footer;
