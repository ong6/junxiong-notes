"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function SiteNavigation() {
	const pathname = usePathname();
	const [dark, setDark] = useState(false);
	const [ready, setReady] = useState(false);
	const manual = useRef(null);
	useEffect(() => {
		try { manual.current = localStorage.getItem("notes-appearance"); } catch {}
		const media = window.matchMedia("(prefers-color-scheme: dark)");
		const sync = () => {
			const isDark = manual.current ? manual.current === "dark" : media.matches;
			setDark(isDark);
			document.documentElement.dataset.theme = isDark ? "dark" : "light";
		};
		sync();
		setReady(true);
		media.addEventListener("change", sync);
		return () => media.removeEventListener("change", sync);
	}, []);
	function toggleTheme() {
		manual.current = !dark ? "dark" : "light";
		try { localStorage.setItem("notes-appearance", manual.current); } catch {}
		setDark(!dark);
		document.documentElement.dataset.theme = !dark ? "dark" : "light";
	}
	return <div className="masthead-navigation">
		<nav aria-label="Main navigation">
			<Link href="/" aria-current={pathname === "/" ? "page" : undefined}>Notes</Link>
			<Link href="/about" aria-current={pathname === "/about" ? "page" : undefined}>About</Link>
			<a href="https://junxiong.dev">Main site <span aria-hidden="true">↗</span></a>
		</nav>
		<button className="theme-toggle" disabled={!ready} onClick={toggleTheme} aria-label="Dark appearance" aria-pressed={dark} title={dark ? "Switch to light appearance" : "Switch to dark appearance"}>
			<svg aria-hidden="true" viewBox="0 0 24 24" width="19" height="19" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M20.5 13.4A8.5 8.5 0 0 1 10.6 3.5a8.5 8.5 0 1 0 9.9 9.9Z" /></svg>
		</button>
	</div>;
}
