// ============================================================================
// Mechanic Settings Shell
// ============================================================================
//
// Edit form for mechanic profile settings (same fields as onboarding).
// Pre-fills from the existing profile.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckSquare, Square } from "lucide-react";

import type { MechanicProfile } from "@/lib/features/mechanic";
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
// Types
// ----------------------------------------------------------------------------

type MechanicSettingsShellProps = {
	profile: MechanicProfile | null;
};

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function MechanicSettingsShell({ profile }: MechanicSettingsShellProps) {
	const router = useRouter();

	const [specialties, setSpecialties] = useState<string[]>(profile?.specialties ?? []);
	const [serviceAreas, setServiceAreas] = useState<string[]>(profile?.serviceAreas ?? []);
	const [hourlyRate, setHourlyRate] = useState(
		profile?.hourlyRate ? String(profile.hourlyRate) : "",
	);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [saved, setSaved] = useState(false);

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
		setSaved(false);

		const rate = parseFloat(hourlyRate);
		if (specialties.length === 0) { setError("Select at least one specialty."); return; }
		if (serviceAreas.length === 0) { setError("Select at least one service city."); return; }
		if (isNaN(rate) || rate <= 0) { setError("Enter a valid hourly rate."); return; }

		setLoading(true);
		try {
			const res = await fetch("/api/mechanic/profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ specialties, serviceAreas, hourlyRate: rate }),
			});
			const json = await res.json();
			if (!json.ok) throw new Error(json.error ?? "Failed to save");
			setSaved(true);
			router.refresh();
		} catch (err) {
			setError(err instanceof Error ? err.message : "Something went wrong");
		} finally {
			setLoading(false);
		}
	}

	return (
		<div container-id="mechanic-settings" className="flex flex-col gap-6">

			<header className="flex flex-col gap-1">
				<h1 className="text-2xl font-bold tracking-tight">Settings</h1>
				<p className="text-sm text-muted-foreground">Update your mechanic profile and service areas.</p>
			</header>

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
									<Badge key={s} variant="secondary" className="rounded-sm text-[10px]">{s}</Badge>
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
						<Label htmlFor="hourly-rate-settings">Hourly rate (PKR)</Label>
						<Input
							id="hourly-rate-settings"
							type="number"
							min={1}
							placeholder="e.g. 1500"
							value={hourlyRate}
							onChange={(e) => setHourlyRate(e.target.value)}
						/>
					</CardContent>
				</Card>

				{error && <p className="text-sm text-destructive">{error}</p>}
				{saved && <p className="text-sm text-green-600">Settings saved successfully.</p>}

				<Button type="submit" disabled={loading} className="w-full sm:w-auto">
					{loading ? "Saving…" : "Save settings"}
				</Button>
			</form>
		</div>
	);
}
