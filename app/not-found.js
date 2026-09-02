import Link from "next/link";

export const metadata = { title: "Not found" };

export default function NotFound() {
	return (
		<main>
			<article>
				<header>
					<h1>Not found</h1>
					<p className="dek">
						That page does not exist. <Link href="/">All articles</Link>.
					</p>
				</header>
			</article>
		</main>
	);
}
