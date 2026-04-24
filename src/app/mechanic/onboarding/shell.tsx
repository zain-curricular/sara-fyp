// ============================================================================
// Mechanic Onboarding Shell
// ============================================================================
//
// Multi-field form for mechanics to set up their profile before accessing
// the mechanic dashboard. Submits to POST /api/mechanic/profile then
// navigates to /mechanic.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckSquare, Square } from "lucide-react";

import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Input } from "@/components/primitives/input";
import { Label } from "@/components/primitives/label";

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const SPECIALTIES = [
	"Engine",
	"Brakes",
	"Suspension",
	"Electrical",
	"Transmission",
	"Cooling System",
	"Fuel System",
	"Exhaust",
	"AC & Heating",
	"Body & Frame",
];

const SERVICE_CITIES = [
	"Lahore",
	"Karachi",
	"Islamabad",
	"Rawalpindi",
	"Faisalabad",
	"Multan",
	"Gujranwala",
	"Sialkot",
	"Peshawar",
	"Quetta",
	"Hyderabad",
	"Bahawalnagar",
];

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export default function MechanicOnboardingShell() {
	const router = useRouter();

	const [specialties, setSpecialties] = useState<string[]>([]);
	const [serviceAreas, setServiceAreas] = useState<string[]>([]);
	const [hourlyRate, setHourlyRate] = useState("");
	const [agreedToTerms, setAgreedToTerms] = useState(false);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	function toggleSpecialty(s: string) {
		setSpecialties((prev) =>
			prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s],
		);
	}

	function toggleCity(c: string) {
		setServiceAreas((prev) =>
			prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c],
		);
	}

	async function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);

		if (specialties.length === 0) {
			setError("Please select at least one specialty.");
			return;
		}
		if (serviceAreas.length === 0) {
			setError("Please select at least one service city.");
			return;
		}
		const rate = parseFloat(hourlyRate);
		if (isNaN(rate) || rate <= 0) {
			setError("Please enter a valid hourly rate.");
			return;
		}
		if (!agreedToTerms) {
			setError("You must agree to the mechanic terms.");
			return;
		}

		setLoading(true);
		try {
			const res = await fetch("/api/mechanic/profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ specialties, serviceAreas, hourlyRate: rate }),
			});
			const json = await res.json();
			if (!json.ok) throw new Error(json.error ?? "Failed to save profile");
			router.push("/mechanic");
		} catch (err) {
			setError(err instanceof Error ? err.message : "Something went wrong");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div container-id="mechanic-onboarding" className="mx-auto max-w-2xl">
			<div className="mb-6 flex flex-col gap-1">
				<h1 className="text-3xl font-bold tracking-tight">Become a mechanic</h1>
				<p className="text-muted-foreground">
					Set up your profile to start accepting part verification requests.
				</p>
			</div>

			<form onSubmit={handleSubmit} className="flex flex-col gap-6">

				{/* Specialties */}
				<Card size="sm">
					<CardHeader>
						<CardTitle className="text-base">Specialties</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-2">
							{SPECIALTIES.map((s) => {
								const active = specialties.includes(s);
								return (
									<button
										key={s}
										type="button"
										onClick={() => toggleSpecialty(s)}
										className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors"
										style={{
											borderColor: active ? "hsl(var(--primary))" : undefined,
											backgroundColor: active ? "hsl(var(--primary) / 0.08)" : undefined,
										}}
									>
										{active ? (
											<CheckSquare className="size-3.5 text-primary" aria-hidden />
										) : (
											<Square className="size-3.5 text-muted-foreground" aria-hidden />
										)}
										{s}
									</button>
								);
							})}
						</div>
						{specialties.length > 0 && (
							<div className="mt-3 flex flex-wrap gap-1">
								{specialties.map((s) => (
									<Badge key={s} variant="secondary" className="rounded-sm text-[10px]">
										{s}
									</Badge>
								))}
							</div>
						)}
					</CardContent>
				</Card>

				{/* Service areas */}
				<Card size="sm">
					<CardHeader>
						<CardTitle className="text-base">Service cities</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="flex flex-wrap gap-2">
							{SERVICE_CITIES.map((c) => {
								const active = serviceAreas.includes(c);
								return (
									<button
										key={c}
										type="button"
										onClick={() => toggleCity(c)}
										className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 text-sm transition-colors"
										style={{
											borderColor: active ? "hsl(var(--primary))" : undefined,
											backgroundColor: active ? "hsl(var(--primary) / 0.08)" : undefined,
										}}
									>
										{active ? (
											<CheckSquare className="size-3.5 text-primary" aria-hidden />
										) : (
											<Square className="size-3.5 text-muted-foreground" aria-hidden />
										)}
										{c}
									</button>
								);
							})}
						</div>
					</CardContent>
				</Card>

				{/* Hourly rate */}
				<Card size="sm">
					<CardContent className="flex flex-col gap-3 pt-4">
						<Label htmlFor="hourly-rate">Hourly rate (PKR)</Label>
						<Input
							id="hourly-rate"
							type="number"
							min={1}
							placeholder="e.g. 1500"
							value={hourlyRate}
							onChange={(e) => setHourlyRate(e.target.value)}
						/>
						<p className="text-xs text-muted-foreground">
							This is your base rate. ShopSmart takes a 10% platform fee per job.
						</p>
					</CardContent>
				</Card>

				{/* Terms */}
				<div className="flex items-start gap-3">
					<button
						type="button"
						onClick={() => setAgreedToTerms((v) => !v)}
						className="mt-0.5 shrink-0"
						aria-label="Agree to mechanic terms"
					>
						{agreedToTerms ? (
							<CheckSquare className="size-5 text-primary" aria-hidden />
						) : (
							<Square className="size-5 text-muted-foreground" aria-hidden />
						)}
					</button>
					<p className="text-sm text-muted-foreground">
						I agree to the ShopSmart mechanic terms and confirm that I am a qualified
						automotive technician. I understand that false verdicts may result in account
						suspension.
					</p>
				</div>

				{/* Error */}
				{error && (
					<p className="text-sm text-destructive">{error}</p>
				)}

				<Button type="submit" disabled={loading} className="w-full sm:w-auto">
					{loading ? "Saving…" : "Complete setup"}
				</Button>
			</form>
		</div>
	);
}
