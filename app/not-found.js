import Link from "next/link";

export const metadata = { title: "Page not found" };

export default function NotFound() {
	return (
		<main id="main-content" tabIndex={-1}>
			<article>
				<header>
					<h1>Page not found</h1>
					<p className="dek">
						That page does not exist. <Link href="/">All notes</Link>.
					</p>
				</header>
			</article>
		</main>
	);
}
