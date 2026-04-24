// ============================================================================
// Home Shell — Landing Page
// ============================================================================
//
// Trust-first editorial landing page. Wireframe variant A: big hero with
// value proposition, live parts ticker, recently-listed card grid, and a
// three-column trust/guarantee section. OLX-inspired colour palette.
//

"use client";

import Link from "next/link";
import { ArrowRight, Banknote, BadgeCheck, Clock, Shield } from "lucide-react";

import { Badge } from "@/components/primitives/badge";
import { buttonVariants } from "@/components/primitives/button";
import { Card, CardContent } from "@/components/primitives/card";
import { cn } from "@/lib/utils";

// ── Static placeholder data (real data fed via page.tsx props later) ─────────

const recentParts = [
	{ id: 1, name: "Toyota Corolla", part: "Alternator", condition: "Used", price: 4800, timeLeft: "4h 12m" },
	{ id: 2, name: "Honda Civic", part: "Brake Caliper", condition: "New", price: 2200, timeLeft: "5h 35m" },
	{ id: 3, name: "Suzuki Cultus", part: "Radiator", condition: "Used", price: 3500, timeLeft: "6h 04m" },
	{ id: 4, name: "KIA Sportage", part: "Strut Assembly", condition: "New", price: 7400, timeLeft: "7h 48m" },
] as const;

const brandChips = [
	{ label: "Toyota", count: "2,340", href: "/browse?brand=toyota" },
	{ label: "Honda", count: "1,872", href: "/browse?brand=honda" },
	{ label: "Suzuki", count: "1,104", href: "/browse?brand=suzuki" },
	{ label: "KIA", count: "643", href: "/browse?brand=kia" },
	{ label: "Yamaha", count: "418", href: "/browse?brand=yamaha" },
] as const;

const trustPoints = [
	{
		num: "01",
		icon: BadgeCheck,
		title: "Mechanic-verified parts",
		description:
			"Every part is inspected by a certified mechanic — compatibility, condition, and OEM match confirmed before listing.",
	},
	{
		num: "02",
		icon: Banknote,
		title: "Money held until you approve",
		description:
			"Your payment sits in escrow. Not happy with the part? Full refund within 14 days, no questions asked.",
	},
	{
		num: "03",
		icon: Shield,
		title: "3-month warranty, all grades",
		description:
			"Parts covered for 3 months. Claim and replace at any of our partnered workshops nationwide.",
	},
] as const;

// ── Component ─────────────────────────────────────────────────────────────────

export default function HomeShell() {
	return (
		<div container-id="home-shell" className="flex flex-col gap-16">

			{/* ── Hero ──────────────────────────────────────────────────────── */}
			<section
				container-id="home-hero"
				className="grid grid-cols-1 items-center gap-10 pt-4 lg:grid-cols-2 lg:gap-16 lg:pt-8"
			>
				<div container-id="home-hero-text" className="flex flex-col gap-6">
					<p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
						A trusted marketplace for auto parts
					</p>

					<h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl">
						Vehicle parts,{" "}
						<span className="text-primary">verified</span>
						{" & "}
						<span className="text-primary">escrowed.</span>
					</h1>

					<p className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
						Every part is inspected by a certified mechanic. Your money is held
						in escrow until you&apos;re satisfied.
					</p>

					<div container-id="home-hero-cta" className="flex flex-wrap gap-3">
						<Link
							href="/browse"
							className={cn(buttonVariants({ size: "lg" }), "gap-2")}
						>
							Shop parts
							<ArrowRight className="size-4" />
						</Link>
						<Link
							href="/seller/listings/new"
							className={cn(buttonVariants({ variant: "outline", size: "lg" }))}
						>
							Sell yours
						</Link>
					</div>
				</div>

				{/* Hero illustration */}
				<div
					container-id="home-hero-image"
					className="aspect-[4/3] overflow-hidden rounded-2xl lg:aspect-square"
				>
					<HeroIllustration />
				</div>
			</section>

			{/* ── Brand / live ticker ───────────────────────────────────────── */}
			<section
				container-id="home-ticker"
				className="flex flex-wrap items-center gap-2"
			>
				<Badge className="gap-1.5 rounded-full px-3 py-1">
					<span className="size-1.5 animate-pulse rounded-full bg-current" />
					LIVE · 38 listings
				</Badge>

				{brandChips.map(({ label, count, href }) => (
					<Link key={label} href={href}>
						<Badge
							variant="secondary"
							className="cursor-pointer rounded-full px-3 py-1 transition-colors hover:bg-muted"
						>
							{label} · {count}
						</Badge>
					</Link>
				))}

				<Link
					href="/browse"
					className="text-xs text-muted-foreground transition-colors hover:text-foreground"
				>
					+18 more →
				</Link>
			</section>

			{/* ── Recently listed ───────────────────────────────────────────── */}
			<section container-id="home-parts" className="flex flex-col gap-5">
				<div className="flex items-center justify-between">
					<h2 className="text-xl font-semibold tracking-tight">Recently listed</h2>
					<Link
						href="/browse?sort=newest"
						className="text-xs text-muted-foreground transition-colors hover:text-foreground"
					>
						See all →
					</Link>
				</div>

				<div
					container-id="home-parts-grid"
					className="grid grid-cols-2 gap-4 lg:grid-cols-4"
				>
					{recentParts.map((item) => (
						<Link key={item.id} href={`/browse`}>
							<Card className="cursor-pointer transition-shadow hover:shadow-md">
								<CardContent className="flex flex-col gap-3 p-4">
									{/* Image placeholder */}
									<div className="aspect-square rounded-lg border border-dashed border-border bg-muted/30" />

									{/* Badges */}
									<div className="flex flex-wrap gap-1.5">
										<Badge variant="secondary" className="rounded-sm text-[10px]">
											{item.condition}
										</Badge>
										<Badge className="rounded-sm text-[10px]">
											LIVE
										</Badge>
									</div>

									{/* Vehicle + part */}
									<div className="flex flex-col gap-0.5">
										<p className="text-sm font-semibold leading-tight">
											{item.part}
										</p>
										<p className="text-xs text-muted-foreground">
											{item.name}
										</p>
									</div>

									{/* Price + timestamp */}
									<div className="flex items-center justify-between">
										<span className="text-base font-bold tabular-nums text-primary">
											Rs {item.price.toLocaleString()}
										</span>
										<span className="flex items-center gap-1 text-xs text-muted-foreground">
											<Clock className="size-3" />
											{item.timeLeft}
										</span>
									</div>
								</CardContent>
							</Card>
						</Link>
					))}
				</div>
			</section>

			{/* ── Trust signals ─────────────────────────────────────────────── */}
			<section container-id="home-trust" className="flex flex-col gap-5 pb-4">
				<h2 className="text-xl font-semibold tracking-tight">Why buy here?</h2>

				<div
					container-id="home-trust-grid"
					className="grid grid-cols-1 gap-4 sm:grid-cols-3"
				>
					{trustPoints.map(({ num, icon: Icon, title, description }) => (
						<Card key={num}>
							<CardContent className="flex flex-col gap-4 p-6">
								<div className="flex items-center gap-3">
									<span className="text-2xl font-bold tabular-nums text-primary">
										{num}
									</span>
									<Icon className="size-5 text-muted-foreground" />
								</div>
								<div className="flex flex-col gap-1.5">
									<p className="font-semibold">{title}</p>
									<p className="text-sm leading-relaxed text-muted-foreground">
										{description}
									</p>
								</div>
							</CardContent>
						</Card>
					))}
				</div>
			</section>

		</div>
	);
}

// ── Hero illustration ─────────────────────────────────────────────────────────
//
// Self-contained SVG: dashboard/screen mockup with a parts listing on screen,
// four floating trust badges (Escrow / Verified / Rating / Parts), and CSS
// float animations. Colors: primary orange #f59332, brand purple #7c4dbe.

function HeroIllustration() {
	return (
		<svg
			viewBox="0 0 520 480"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-label="automart — browse and buy certified auto parts"
			className="h-full w-full"
		>
			<defs>
				<radialGradient id="am-bg" cx="50%" cy="40%" r="75%">
					<stop offset="0%" stopColor="#fff8f0" />
					<stop offset="100%" stopColor="#ede9fe" />
				</radialGradient>
				<linearGradient id="am-screen" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#22223a" />
					<stop offset="100%" stopColor="#14142a" />
				</linearGradient>
				<linearGradient id="am-photo" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stopColor="#e0e8f5" />
					<stop offset="100%" stopColor="#c4d0ec" />
				</linearGradient>
				<linearGradient id="am-btn" x1="0" y1="0" x2="1" y2="0">
					<stop offset="0%" stopColor="#f59332" />
					<stop offset="100%" stopColor="#df7010" />
				</linearGradient>
				<linearGradient id="am-lock-bg" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stopColor="#f59332" />
					<stop offset="100%" stopColor="#d06010" />
				</linearGradient>
				<filter id="am-screen-glow">
					<feDropShadow dx="0" dy="18" stdDeviation="26" floodColor="rgba(0,0,0,0.22)" floodOpacity="1" />
				</filter>
				<filter id="am-badge-glow">
					<feDropShadow dx="0" dy="4" stdDeviation="10" floodColor="rgba(0,0,0,0.10)" floodOpacity="1" />
				</filter>
			</defs>

			<style>{`
				@keyframes am-float {
					0%, 100% { transform: translateY(0px); }
					50%       { transform: translateY(-10px); }
				}
				@keyframes am-sink {
					0%, 100% { transform: translateY(-4px); }
					50%       { transform: translateY(6px); }
				}
				.am-a { animation: am-float 3.3s ease-in-out infinite; }
				.am-b { animation: am-sink  3.9s ease-in-out infinite; animation-delay: 0.7s; }
				.am-c { animation: am-float 4.2s ease-in-out infinite; animation-delay: 1.3s; }
				.am-d { animation: am-sink  3.6s ease-in-out infinite; animation-delay: 2.0s; }
			`}</style>

			{/* Background */}
			<rect width="520" height="480" rx="20" fill="url(#am-bg)" />

			{/* Decorative accent circles */}
			<circle cx="462" cy="76"  r="72" fill="#f59332" fillOpacity="0.07" />
			<circle cx="58"  cy="408" r="82" fill="#7c4dbe" fillOpacity="0.07" />
			<circle cx="474" cy="400" r="40" fill="#f59332" fillOpacity="0.05" />
			<circle cx="50"  cy="86"  r="28" fill="#7c4dbe" fillOpacity="0.05" />

			{/* Dot grid — top right */}
			{[0,1,2,3,4].flatMap(r => [0,1,2,3].map(c => (
				<circle key={`tr-${r}-${c}`} cx={400 + c * 18} cy={26 + r * 18} r="2.2" fill="#f59332" fillOpacity="0.22" />
			)))}

			{/* Dot grid — bottom left */}
			{[0,1,2].flatMap(r => [0,1,2,3].map(c => (
				<circle key={`bl-${r}-${c}`} cx={22 + c * 18} cy={326 + r * 18} r="2.2" fill="#7c4dbe" fillOpacity="0.22" />
			)))}

			{/* ──────────────────────────────────────────────────────── */}
			{/* LAPTOP / TABLET FRAME                                    */}
			{/* ──────────────────────────────────────────────────────── */}
			<g filter="url(#am-screen-glow)">
				{/* Lid / screen outer */}
				<rect x="148" y="54" width="224" height="290" rx="16" fill="url(#am-screen)" />
				{/* Screen bezel */}
				<rect x="158" y="64" width="204" height="270" rx="10" fill="white" />
				{/* Hinge line */}
				<rect x="148" y="344" width="224" height="10" rx="3" fill="#1a1a30" />
				{/* Base */}
				<rect x="118" y="354" width="284" height="14" rx="7" fill="#22223a" />
				<rect x="108" y="365" width="304" height="6"  rx="3" fill="#14142a" />
			</g>

			{/* ── Browser chrome ── */}
			<rect x="158" y="64" width="204" height="22" rx="0" fill="#f5f5f8" />
			<rect x="158" y="85" width="204" height="1" fill="#e0e0e8" />
			{/* Traffic lights */}
			<circle cx="170" cy="75" r="4" fill="#ff5f57" />
			<circle cx="183" cy="75" r="4" fill="#febc2e" />
			<circle cx="196" cy="75" r="4" fill="#28c840" />
			{/* URL bar */}
			<rect x="207" y="68" width="130" height="14" rx="7" fill="#e8e8f0" />
			<text x="272" y="78.5" fontSize="7" fill="#888" textAnchor="middle" fontFamily="system-ui,sans-serif">automart.pk/browse</text>

			{/* ── App header bar ── */}
			<rect x="158" y="86" width="204" height="24" fill="white" />
			<line x1="158" y1="110" x2="362" y2="110" stroke="#eef0f5" strokeWidth="1" />
			{/* Brand mark */}
			<circle cx="168" cy="98" r="4.5" fill="#7c4dbe" />
			<text x="178" y="101.5" fontSize="8.5" fontWeight="800" fill="#111" fontFamily="system-ui,sans-serif">automart</text>
			{/* Search pill */}
			<rect x="230" y="91" width="94" height="14" rx="7" fill="#f3f3f8" stroke="#e0e0ea" strokeWidth="0.8" />
			<text x="277" y="101" fontSize="7" fill="#aaa" textAnchor="middle" fontFamily="system-ui,sans-serif">Search parts…</text>

			{/* ── Listing card ── */}
			<rect x="164" y="116" width="192" height="192" rx="10" fill="white" stroke="#eef0f5" strokeWidth="1" />

			{/* Card image */}
			<rect x="164" y="116" width="192" height="90" rx="10" fill="url(#am-photo)" />
			<rect x="164" y="188" width="192" height="18" fill="url(#am-photo)" />

			{/* Alternator icon in image */}
			{/* Gear body */}
			<circle cx="260" cy="156" r="26" fill="#8898b8" />
			<circle cx="260" cy="156" r="18" fill="#b8c4d8" />
			<circle cx="260" cy="156" r="9"  fill="#6678a0" />
			{/* Gear teeth */}
			{[0,45,90,135,180,225,270,315].map((deg, i) => {
				const rad = (deg * Math.PI) / 180;
				const x1 = 260 + 24 * Math.cos(rad);
				const y1 = 156 + 24 * Math.sin(rad);
				const x2 = 260 + 30 * Math.cos(rad);
				const y2 = 156 + 30 * Math.sin(rad);
				return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#6678a0" strokeWidth="5" strokeLinecap="round" />;
			})}
			{/* Highlight */}
			<circle cx="253" cy="149" r="5" fill="white" fillOpacity="0.18" />

			{/* Condition badge */}
			<rect x="170" y="122" width="32" height="14" rx="4" fill="#16a34a" />
			<text x="173" y="131.5" fontSize="7.5" fontWeight="700" fill="white" fontFamily="system-ui,sans-serif">Used</text>

			{/* LIVE badge */}
			<rect x="206" y="122" width="32" height="14" rx="4" fill="#f59332" />
			<circle cx="213" cy="129" r="2.5" fill="white" fillOpacity="0.9" />
			<text x="218" y="132" fontSize="7" fontWeight="700" fill="white" fontFamily="system-ui,sans-serif">LIVE</text>

			{/* Listing details */}
			<text x="172" y="228" fontSize="11" fontWeight="700" fill="#111" fontFamily="system-ui,sans-serif">Alternator</text>
			<text x="172" y="239" fontSize="8"   fill="#999"             fontFamily="system-ui,sans-serif">Toyota Corolla · OEM Match</text>

			{/* Price */}
			<text x="172" y="257" fontSize="14" fontWeight="800" fill="#f59332" fontFamily="system-ui,sans-serif">Rs 4,800</text>

			{/* Stars */}
			<text x="214" y="257" fontSize="9" fill="#f59e0b" fontFamily="system-ui,sans-serif">★★★★★</text>
			<text x="258" y="257" fontSize="8" fill="#aaa"   fontFamily="system-ui,sans-serif">4.9</text>

			{/* CTA button */}
			<rect x="172" y="264" width="176" height="26" rx="13" fill="url(#am-btn)" />
			<text x="260" y="281" fontSize="9.5" fontWeight="700" fill="white" textAnchor="middle" fontFamily="system-ui,sans-serif">Buy now — Rs 4,800</text>

			{/* ── Second card (partial preview) ── */}
			<rect x="164" y="314" width="192" height="46" rx="8" fill="white" stroke="#eef0f5" strokeWidth="1" />
			<rect x="170" y="320" width="38" height="34" rx="6" fill="url(#am-photo)" />
			{/* Brake disc icon */}
			<circle cx="189" cy="337" r="12" fill="#8898b8" />
			<circle cx="189" cy="337" r="7" fill="#b8c4d8" />
			<circle cx="189" cy="337" r="3" fill="#6678a0" />
			<text x="214" y="332" fontSize="8.5" fontWeight="600" fill="#111" fontFamily="system-ui,sans-serif">Brake Caliper</text>
			<text x="214" y="342" fontSize="7.5" fill="#aaa"             fontFamily="system-ui,sans-serif">Honda Civic · New</text>
			<text x="214" y="354" fontSize="10"  fontWeight="800" fill="#f59332" fontFamily="system-ui,sans-serif">Rs 2,200</text>

			{/* ──────────────────────────────────────────────────────── */}
			{/* FLOATING TRUST BADGES                                    */}
			{/* ──────────────────────────────────────────────────────── */}

			{/* Escrow protected — right upper */}
			<g className="am-a" filter="url(#am-badge-glow)">
				<rect x="360" y="88" width="148" height="54" rx="14" fill="white" />
				<rect x="370" y="98" width="34" height="34" rx="10" fill="url(#am-lock-bg)" />
				{/* Lock body */}
				<rect x="377" y="110" width="20" height="14" rx="3" fill="white" />
				{/* Lock shackle */}
				<path d="M379 110 L379 106 Q379 102 387 102 Q395 102 395 106 L395 110" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
				{/* Keyhole */}
				<circle cx="387" cy="116.5" r="2.5" fill="#f59332" />
				<text x="412" y="112" fontSize="10"  fontWeight="700" fill="#111" fontFamily="system-ui,sans-serif">Escrow</text>
				<text x="412" y="126" fontSize="8.5" fill="#888"             fontFamily="system-ui,sans-serif">Protected</text>
			</g>

			{/* Mechanic verified — left upper */}
			<g className="am-b" filter="url(#am-badge-glow)">
				<rect x="12" y="130" width="148" height="54" rx="14" fill="white" />
				<rect x="22" y="140" width="34" height="34" rx="10" fill="#dcfce7" />
				{/* Wrench icon */}
				<path d="M34 148 L40 154 L46 148 L44 146 L40 150 L36 146 Z" fill="#16a34a" />
				<circle cx="33" cy="159" r="5" fill="none" stroke="#16a34a" strokeWidth="2.5" />
				<text x="64" y="154" fontSize="10"  fontWeight="700" fill="#111" fontFamily="system-ui,sans-serif">Mechanic</text>
				<text x="64" y="168" fontSize="8.5" fill="#888"             fontFamily="system-ui,sans-serif">Verified ✓</text>
			</g>

			{/* Star rating — left lower */}
			<g className="am-c" filter="url(#am-badge-glow)">
				<rect x="12" y="316" width="148" height="54" rx="14" fill="white" />
				<rect x="22" y="326" width="34" height="34" rx="10" fill="#fef3c7" />
				{/* 5-pointed star */}
				<polygon
					points="39,328 41.3,334.8 48.4,334.8 42.7,339.0 44.9,345.8 39,341.7 33.1,345.8 35.3,339.0 29.6,334.8 36.7,334.8"
					fill="#f59e0b"
				/>
				<text x="64" y="342" fontSize="12"  fontWeight="800" fill="#111" fontFamily="system-ui,sans-serif">4.9 / 5</text>
				<text x="64" y="356" fontSize="8.5" fill="#888"             fontFamily="system-ui,sans-serif">1,800+ reviews</text>
			</g>

			{/* Parts listed — right lower */}
			<g className="am-d" filter="url(#am-badge-glow)">
				<rect x="360" y="302" width="148" height="54" rx="14" fill="white" />
				<rect x="370" y="312" width="34" height="34" rx="10" fill="#ede9fe" />
				{/* Gear icon */}
				<circle cx="387" cy="329" r="8"  fill="#7c4dbe" />
				<circle cx="387" cy="329" r="4"  fill="white" fillOpacity="0.75" />
				{[0,60,120,180,240,300].map((deg, i) => {
					const rad = (deg * Math.PI) / 180;
					const x1 = 387 + 7 * Math.cos(rad);
					const y1 = 329 + 7 * Math.sin(rad);
					const x2 = 387 + 10 * Math.cos(rad);
					const y2 = 329 + 10 * Math.sin(rad);
					return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#7c4dbe" strokeWidth="3" strokeLinecap="round" />;
				})}
				<text x="412" y="326" fontSize="12"  fontWeight="800" fill="#111" fontFamily="system-ui,sans-serif">8,400+</text>
				<text x="412" y="340" fontSize="8.5" fill="#888"             fontFamily="system-ui,sans-serif">parts listed</text>
			</g>
		</svg>
	);
}
