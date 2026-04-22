// ============================================================================
// Home Shell — Landing Page
// ============================================================================
//
// Trust-first editorial landing page. Wireframe variant A: big hero with
// value proposition, live auction ticker, ending-soon card grid, and a
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

const endingSoon = [
	{ id: 1, name: "iPhone 13 Pro", storage: "256GB", grade: "A", bidPrice: 342, timeLeft: "4h 12m" },
	{ id: 2, name: "iPhone 14 Pro Max", storage: "512GB", grade: "A", bidPrice: 601, timeLeft: "5h 35m" },
	{ id: 3, name: "Samsung Galaxy S24", storage: "256GB", grade: "B", bidPrice: 281, timeLeft: "6h 04m" },
	{ id: 4, name: "Pixel 8 Pro", storage: "128GB", grade: "A", bidPrice: 241, timeLeft: "7h 48m" },
] as const;

const brandChips = [
	{ label: "iPhone", count: "1,204", href: "/browse?brand=apple" },
	{ label: "Samsung", count: "987", href: "/browse?brand=samsung" },
	{ label: "Pixel", count: "213", href: "/browse?brand=google" },
	{ label: "Xiaomi", count: "544", href: "/browse?brand=xiaomi" },
	{ label: "OnePlus", count: "312", href: "/browse?brand=oneplus" },
] as const;

const trustPoints = [
	{
		num: "01",
		icon: BadgeCheck,
		title: "18-point quality check",
		description:
			"Battery, screen, mic, cameras, housing, and boot — every device inspected by a certified centre.",
	},
	{
		num: "02",
		icon: Banknote,
		title: "Money held until you approve",
		description:
			"Your payment sits in escrow. Not happy? Full refund within 14 days, no questions asked.",
	},
	{
		num: "03",
		icon: Shield,
		title: "6-month warranty, all grades",
		description:
			"Claim and repair at any of our partnered service centres nationwide.",
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
						A trusted marketplace for phones
					</p>

					<h1 className="text-balance text-4xl font-bold tracking-tight sm:text-5xl xl:text-6xl">
						Used phones,{" "}
						<span className="text-primary">tested</span>
						{" & "}
						<span className="text-primary">escrowed.</span>
					</h1>

					<p className="max-w-md text-base leading-relaxed text-muted-foreground sm:text-lg">
						Every device is inspected by a certified centre. Your money is held
						in escrow until you&apos;re happy.
					</p>

					<div container-id="home-hero-cta" className="flex flex-wrap gap-3">
						<Link
							href="/browse"
							className={cn(buttonVariants({ size: "lg" }), "gap-2")}
						>
							Shop phones
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
					LIVE · 42 auctions
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
					+12 more →
				</Link>
			</section>

			{/* ── Ending soon ───────────────────────────────────────────────── */}
			<section container-id="home-auctions" className="flex flex-col gap-5">
				<div className="flex items-center justify-between">
					<h2 className="text-xl font-semibold tracking-tight">Ending soon</h2>
					<Link
						href="/browse?sort=ending-soon"
						className="text-xs text-muted-foreground transition-colors hover:text-foreground"
					>
						See all →
					</Link>
				</div>

				<div
					container-id="home-auctions-grid"
					className="grid grid-cols-2 gap-4 lg:grid-cols-4"
				>
					{endingSoon.map((item) => (
						<Link key={item.id} href={`/browse`}>
							<Card className="cursor-pointer transition-shadow hover:shadow-md">
								<CardContent className="flex flex-col gap-3 p-4">
									{/* Image placeholder */}
									<div className="aspect-square rounded-lg border border-dashed border-border bg-muted/30" />

									{/* Badges */}
									<div className="flex flex-wrap gap-1.5">
										<Badge variant="secondary" className="rounded-sm text-[10px]">
											Grade {item.grade}
										</Badge>
										<Badge className="rounded-sm text-[10px]">
											LIVE
										</Badge>
									</div>

									{/* Name + storage */}
									<div className="flex flex-col gap-0.5">
										<p className="text-sm font-semibold leading-tight">
											{item.name}
										</p>
										<p className="text-xs text-muted-foreground">
											{item.storage} · unlocked
										</p>
									</div>

									{/* Price + countdown */}
									<div className="flex items-center justify-between">
										<span className="text-base font-bold tabular-nums text-primary">
											${item.bidPrice}
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
// Self-contained SVG: phone mockup with a live listing on screen, four floating
// trust badges (Escrow / Quality / Rating / Phones), and CSS float animations.
// Colors approximate the app palette: primary orange #f59332, brand purple #7c4dbe.

function HeroIllustration() {
	return (
		<svg
			viewBox="0 0 520 480"
			fill="none"
			xmlns="http://www.w3.org/2000/svg"
			role="img"
			aria-label="mobilemart — browse and buy certified phones"
			className="h-full w-full"
		>
			<defs>
				<radialGradient id="mm-bg" cx="50%" cy="40%" r="75%">
					<stop offset="0%" stopColor="#fff8f0" />
					<stop offset="100%" stopColor="#ede9fe" />
				</radialGradient>
				<linearGradient id="mm-phone" x1="0" y1="0" x2="0" y2="1">
					<stop offset="0%" stopColor="#22223a" />
					<stop offset="100%" stopColor="#14142a" />
				</linearGradient>
				<linearGradient id="mm-photo" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stopColor="#e0e8f5" />
					<stop offset="100%" stopColor="#c4d0ec" />
				</linearGradient>
				<linearGradient id="mm-btn" x1="0" y1="0" x2="1" y2="0">
					<stop offset="0%" stopColor="#f59332" />
					<stop offset="100%" stopColor="#df7010" />
				</linearGradient>
				<linearGradient id="mm-lock-bg" x1="0" y1="0" x2="1" y2="1">
					<stop offset="0%" stopColor="#f59332" />
					<stop offset="100%" stopColor="#d06010" />
				</linearGradient>
				<filter id="mm-phone-glow">
					<feDropShadow dx="0" dy="18" stdDeviation="26" floodColor="rgba(0,0,0,0.22)" floodOpacity="1" />
				</filter>
				<filter id="mm-badge-glow">
					<feDropShadow dx="0" dy="4" stdDeviation="10" floodColor="rgba(0,0,0,0.10)" floodOpacity="1" />
				</filter>
			</defs>

			<style>{`
				@keyframes mm-float {
					0%, 100% { transform: translateY(0px); }
					50%       { transform: translateY(-10px); }
				}
				@keyframes mm-sink {
					0%, 100% { transform: translateY(-4px); }
					50%       { transform: translateY(6px); }
				}
				.mm-a { animation: mm-float 3.3s ease-in-out infinite; }
				.mm-b { animation: mm-sink  3.9s ease-in-out infinite; animation-delay: 0.7s; }
				.mm-c { animation: mm-float 4.2s ease-in-out infinite; animation-delay: 1.3s; }
				.mm-d { animation: mm-sink  3.6s ease-in-out infinite; animation-delay: 2.0s; }
			`}</style>

			{/* Background */}
			<rect width="520" height="480" rx="20" fill="url(#mm-bg)" />

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
			{/* PHONE FRAME                                              */}
			{/* ──────────────────────────────────────────────────────── */}
			<g filter="url(#mm-phone-glow)">
				{/* Body */}
				<rect x="173" y="44" width="174" height="368" rx="30" fill="url(#mm-phone)" />
				{/* Volume up */}
				<rect x="169" y="136" width="4" height="26" rx="2" fill="#2e2e4a" />
				{/* Volume down */}
				<rect x="169" y="170" width="4" height="26" rx="2" fill="#2e2e4a" />
				{/* Power */}
				<rect x="347" y="158" width="4" height="38" rx="2" fill="#2e2e4a" />
				{/* Screen */}
				<rect x="182" y="60" width="156" height="330" rx="22" fill="white" />
			</g>

			{/* Dynamic island */}
			<rect x="228" y="68" width="64" height="20" rx="10" fill="#14142a" />

			{/* ── Status bar ── */}
			<text x="192" y="82" fontSize="9" fontWeight="700" fill="#222" fontFamily="system-ui,sans-serif">9:41</text>
			{/* Signal bars */}
			<rect x="291" y="78" width="3" height="7"  rx="1" fill="#555" />
			<rect x="296" y="76" width="3" height="9"  rx="1" fill="#555" />
			<rect x="301" y="74" width="3" height="11" rx="1" fill="#555" />
			{/* Battery */}
			<rect x="308" y="74" width="20" height="10" rx="2.5" fill="none" stroke="#555" strokeWidth="1.2" />
			<rect x="328" y="76.5" width="2.5" height="5" rx="1" fill="#555" />
			<rect x="309.5" y="75.5" width="16" height="7" rx="1.5" fill="#22c55e" />

			{/* ── App header ── */}
			<rect x="182" y="92" width="156" height="28" fill="white" />
			<line x1="182" y1="119" x2="338" y2="119" stroke="#eef0f5" strokeWidth="1" />
			{/* Brand mark */}
			<circle cx="194" cy="106" r="5.5" fill="#7c4dbe" />
			<text x="204" y="110" fontSize="10.5" fontWeight="800" fill="#111" fontFamily="system-ui,sans-serif">mobilemart</text>
			{/* Avatar */}
			<circle cx="322" cy="106" r="9" fill="#f0ebff" />
			<circle cx="322" cy="103" r="3.5" fill="#7c4dbe" fillOpacity="0.5" />
			<ellipse cx="322" cy="112" rx="5" ry="3.2" fill="#7c4dbe" fillOpacity="0.3" />

			{/* ── Listing card ── */}
			<rect x="188" y="125" width="144" height="196" rx="12" fill="white" stroke="#eef0f5" strokeWidth="1" />

			{/* Card image */}
			<rect x="188" y="125" width="144" height="96" rx="12" fill="url(#mm-photo)" />
			<rect x="188" y="197" width="144" height="24" fill="url(#mm-photo)" />

			{/* Phone in image */}
			<rect x="228" y="132" width="64" height="83" rx="9" fill="#b8c4d8" />
			<rect x="232" y="136" width="56" height="71" rx="6" fill="#8898b8" />
			<rect x="235" y="139" width="50" height="62" rx="3.5" fill="#dce4f0" />
			{/* Camera bump */}
			<rect x="246" y="142" width="22" height="13" rx="4" fill="#7888a8" />
			<circle cx="253" cy="148.5" r="4.2" fill="#4e60a0" />
			<circle cx="263" cy="148.5" r="3" fill="#4e60a0" />
			{/* Lens shine */}
			<circle cx="252" cy="147" r="1.2" fill="white" fillOpacity="0.4" />
			{/* Phone screen highlight */}
			<rect x="237" y="142" width="7" height="55" rx="3.5" fill="white" fillOpacity="0.09" />

			{/* Grade badge */}
			<rect x="194" y="131" width="36" height="15" rx="4.5" fill="#16a34a" />
			<text x="197.5" y="141.5" fontSize="8" fontWeight="700" fill="white" fontFamily="system-ui,sans-serif">Grade A</text>

			{/* LIVE badge */}
			<rect x="234" y="131" width="32" height="15" rx="4.5" fill="#f59332" />
			<circle cx="241" cy="138.5" r="2.8" fill="white" fillOpacity="0.9" />
			<text x="246" y="141.5" fontSize="7.5" fontWeight="700" fill="white" fontFamily="system-ui,sans-serif">LIVE</text>

			{/* Listing details */}
			<text x="196" y="242" fontSize="11" fontWeight="700" fill="#111" fontFamily="system-ui,sans-serif">iPhone 13 Pro</text>
			<text x="196" y="254" fontSize="8.5" fill="#999" fontFamily="system-ui,sans-serif">256GB · Midnight · Unlocked</text>

			{/* Price */}
			<text x="196" y="271" fontSize="15" fontWeight="800" fill="#f59332" fontFamily="system-ui,sans-serif">$342</text>

			{/* Stars */}
			<text x="228" y="271" fontSize="9" fill="#f59e0b" fontFamily="system-ui,sans-serif">★★★★★</text>
			<text x="275" y="271" fontSize="8" fill="#aaa" fontFamily="system-ui,sans-serif">4.8</text>

			{/* CTA button */}
			<rect x="196" y="278" width="128" height="28" rx="14" fill="url(#mm-btn)" />
			<text x="260" y="296" fontSize="10" fontWeight="700" fill="white" textAnchor="middle" fontFamily="system-ui,sans-serif">Buy now — $342</text>

			{/* ── Second card (partial preview) ── */}
			<rect x="188" y="328" width="144" height="52" rx="10" fill="white" stroke="#eef0f5" strokeWidth="1" />
			<rect x="194" y="334" width="42" height="40" rx="6" fill="url(#mm-photo)" />
			<text x="244" y="347" fontSize="9" fontWeight="600" fill="#111" fontFamily="system-ui,sans-serif">Galaxy S24 Ultra</text>
			<text x="244" y="358" fontSize="8"   fill="#aaa"             fontFamily="system-ui,sans-serif">512GB · Grade B</text>
			<text x="244" y="372" fontSize="11"  fontWeight="800" fill="#f59332" fontFamily="system-ui,sans-serif">$499</text>

			{/* Home bar */}
			<rect x="228" y="384" width="64" height="4" rx="2" fill="#999" fillOpacity="0.28" />

			{/* ──────────────────────────────────────────────────────── */}
			{/* FLOATING TRUST BADGES                                    */}
			{/* ──────────────────────────────────────────────────────── */}

			{/* Escrow protected — right upper */}
			<g className="mm-a" filter="url(#mm-badge-glow)">
				<rect x="360" y="100" width="148" height="54" rx="14" fill="white" />
				{/* Icon bg */}
				<rect x="370" y="110" width="34" height="34" rx="10" fill="url(#mm-lock-bg)" />
				{/* Lock body */}
				<rect x="377" y="122" width="20" height="14" rx="3" fill="white" />
				{/* Lock shackle */}
				<path d="M379 122 L379 118 Q379 114 387 114 Q395 114 395 118 L395 122" stroke="white" strokeWidth="2.5" fill="none" strokeLinecap="round" />
				{/* Keyhole */}
				<circle cx="387" cy="128.5" r="2.5" fill="#f59332" />
				<text x="412" y="124" fontSize="10"  fontWeight="700" fill="#111" fontFamily="system-ui,sans-serif">Escrow</text>
				<text x="412" y="138" fontSize="8.5" fill="#888"             fontFamily="system-ui,sans-serif">Protected</text>
			</g>

			{/* Quality checked — left upper */}
			<g className="mm-b" filter="url(#mm-badge-glow)">
				<rect x="12" y="140" width="148" height="54" rx="14" fill="white" />
				<rect x="22" y="150" width="34" height="34" rx="10" fill="#dcfce7" />
				{/* Check */}
				<path d="M31 167 L37 173 L47 161" stroke="#16a34a" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" />
				<text x="64" y="165" fontSize="10"  fontWeight="700" fill="#111" fontFamily="system-ui,sans-serif">Quality</text>
				<text x="64" y="179" fontSize="8.5" fill="#888"             fontFamily="system-ui,sans-serif">Checked ✓</text>
			</g>

			{/* Star rating — left lower */}
			<g className="mm-c" filter="url(#mm-badge-glow)">
				<rect x="12" y="316" width="148" height="54" rx="14" fill="white" />
				<rect x="22" y="326" width="34" height="34" rx="10" fill="#fef3c7" />
				{/* 5-pointed star */}
				<polygon
					points="39,328 41.3,334.8 48.4,334.8 42.7,339.0 44.9,345.8 39,341.7 33.1,345.8 35.3,339.0 29.6,334.8 36.7,334.8"
					fill="#f59e0b"
				/>
				<text x="64" y="342" fontSize="12"  fontWeight="800" fill="#111" fontFamily="system-ui,sans-serif">4.8 / 5</text>
				<text x="64" y="356" fontSize="8.5" fill="#888"             fontFamily="system-ui,sans-serif">2,100+ reviews</text>
			</g>

			{/* Phones listed — right lower */}
			<g className="mm-d" filter="url(#mm-badge-glow)">
				<rect x="360" y="302" width="148" height="54" rx="14" fill="white" />
				<rect x="370" y="312" width="34" height="34" rx="10" fill="#ede9fe" />
				{/* Phone icon */}
				<rect x="378" y="317" width="18" height="24" rx="4" fill="#7c4dbe" />
				<rect x="380" y="319" width="14" height="17" rx="2" fill="white" fillOpacity="0.75" />
				<circle cx="387" cy="338.5" r="2" fill="white" fillOpacity="0.75" />
				<text x="412" y="329" fontSize="12"  fontWeight="800" fill="#111" fontFamily="system-ui,sans-serif">3,200+</text>
				<text x="412" y="343" fontSize="8.5" fill="#888"             fontFamily="system-ui,sans-serif">phones listed</text>
			</g>
		</svg>
	);
}
