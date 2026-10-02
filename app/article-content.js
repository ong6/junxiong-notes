"use client";

import { useEffect, useRef } from "react";

function setPaused(figure, paused) {
	for (const svg of figure.querySelectorAll("svg")) {
		if (paused) svg.pauseAnimations?.();
		else svg.unpauseAnimations?.();
	}
	figure.dataset.paused = String(paused);
	const button = figure.querySelector("[data-figure-motion]");
	if (button) {
		button.disabled = false;
		button.textContent = paused ? "Play diagram" : "Pause diagram";
	}
}

export default function ArticleContent({ html }) {
	const root = useRef(null);
	useEffect(() => {
		const media = window.matchMedia("(prefers-reduced-motion: reduce)");
		const sync = () => {
			for (const figure of root.current.querySelectorAll(".fig")) {
				delete figure.dataset.userPlay;
				setPaused(figure, media.matches);
			}
		};
		sync();
		media.addEventListener("change", sync);
		return () => media.removeEventListener("change", sync);
	}, [html]);
	useEffect(() => {
		// On phones a wide figure scrolls sideways inside .fig-scroll. Only then is it
		// a keyboard stop and a named region; on desktop it doesn't scroll, so it isn't.
		if (typeof ResizeObserver === "undefined") return;
		const mark = (box) => {
			const scrolls = box.scrollWidth > box.clientWidth + 1;
			// The swipe hint is shown by CSS on phones; hide it if there is nothing to swipe to.
			box.closest(".fig").dataset.scrolls = String(scrolls);
			if (scrolls) {
				box.tabIndex = 0;
				box.setAttribute("role", "region");
				box.setAttribute("aria-label", "Scrollable figure");
			} else {
				box.removeAttribute("tabindex");
				box.removeAttribute("role");
				box.removeAttribute("aria-label");
			}
		};
		const observer = new ResizeObserver((entries) => entries.forEach((entry) => mark(entry.target)));
		root.current.querySelectorAll(".fig-scroll").forEach((box) => observer.observe(box));
		return () => observer.disconnect();
	}, [html]);
	function onClick(event) {
		const button = event.target.closest("[data-figure-motion]");
		if (!button) return;
		const figure = button.closest(".fig");
		const paused = figure.dataset.paused !== "true";
		figure.dataset.userPlay = String(!paused);
		setPaused(figure, paused);
	}
	return <div ref={root} className="prose" onClick={onClick} dangerouslySetInnerHTML={{ __html: html }} />;
}
