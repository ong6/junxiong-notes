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
