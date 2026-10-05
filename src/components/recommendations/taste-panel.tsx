// ============================================================================
// TastePanel
// ============================================================================
//
// Floating "Your taste · live" card, always visible on public routes. It makes
// the recommendation engine's state legible in real time:
//
//   - vehicle affinity bars (recency-weighted shares)
//   - the part type they keep opening
//   - budget (hard from a filter, or soft from viewed prices)
//   - preferred condition + the latest recorded action
//   - the engine's last decision (strategy + server/round-trip ms)
//   - a one-line AI read of intent (Haiku; rules fallback)
//
// Everything except the AI line updates in the same frame as the click (the
// profile is computed in-browser). Collapsible; collapsed state is a
// per-viewer convenience kept in localStorage.

"use client";

import { useSyncExternalStore } from "react";
import { Gauge, Minus, MousePointerClick, RotateCcw, Sparkles, Wallet, Wrench } from "lucide-react";

import {
	CONDITION_LABELS,
	clearBehaviourEvents,
	formatPriceShort,
	isColdProfile,
	useLastDecision,
	useTasteExplanation,
	useTasteProfile,
	type RecommendationStrategy,
	type TasteProfile,
} from "@/lib/features/recommendations";
import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/primitives/card";
import { Progress } from "@/components/primitives/progress";
import { Separator } from "@/components/primitives/separator";

const COLLAPSED_KEY = "mm:taste-panel-collapsed";

const STRATEGY_LABELS: Record<RecommendationStrategy, string> = {
	"cold-start": "Trending",
	"vehicle-led": "Vehicle-led",
	"budget-led": "Budget-led",
	"part-led": "Part-led",
	blended: "Blended",
};

// -- Helpers ----------------------------------------------------------------------

function budgetLabel(profile: TasteProfile): string | null {
	const { min, max, target, source } = profile.budget;
	if (source === "filter") {
		if (min !== null && max !== null) return `${formatPriceShort(min)} – ${formatPriceShort(max)}`;
		if (max !== null) return `Under ${formatPriceShort(max)}`;
		if (min !== null) return `Over ${formatPriceShort(min)}`;
	}
	if (source === "views" && target !== null) return `~${formatPriceShort(target)}`;
	return null;
}

function modelLabel(model: string | null): string {
	if (!model) return "Rules";
	if (model.includes("haiku")) return "Haiku 4.5";
	if (model.includes("sonnet")) return "Sonnet";
	if (model.startsWith("gpt-")) return model.replace("gpt-", "GPT-");
	return model;
}

function readCollapsed(): boolean {
	try {
		return window.localStorage.getItem(COLLAPSED_KEY) === "1";
	} catch {
		return false;
	}
}

const collapsedListeners = new Set<() => void>();
let collapsedMemory: boolean | null = null;

function getCollapsed(): boolean {
	if (collapsedMemory === null) collapsedMemory = readCollapsed();
	return collapsedMemory;
}

function subscribeCollapsed(listener: () => void) {
	collapsedListeners.add(listener);
	return () => {
		collapsedListeners.delete(listener);
	};
}

function writeCollapsed(value: boolean) {
	collapsedMemory = value;
	try {
		window.localStorage.setItem(COLLAPSED_KEY, value ? "1" : "0");
	} catch {
		// Preference just won't persist.
	}
	for (const listener of collapsedListeners) listener();
}

// -- Component --------------------------------------------------------------------

/** Floating live view of the shopper's taste profile and engine decisions. */
export function TastePanel() {
	const profile = useTasteProfile();
	const decision = useLastDecision();
	const { explanation, isLoading: explaining } = useTasteExplanation();
	const collapsed = useSyncExternalStore(subscribeCollapsed, getCollapsed, () => false);
	const toggleCollapsed = writeCollapsed;

	const cold = isColdProfile(profile);
	const topVehicle = profile.vehicles[0];
	const budget = budgetLabel(profile);
	const topPart = profile.partTypes[0];
	const topCondition = profile.conditions[0];

	// Collapsed: a single pill summarising the top signal
	if (collapsed) {
		return (
			<div container-id="taste-panel" className="fixed bottom-4 left-4 z-40 sm:bottom-6 sm:left-6">
				<Button variant="outline" size="sm" className="gap-2 shadow-lg" onClick={() => toggleCollapsed(false)}>
					<span className="size-2 animate-pulse rounded-full bg-emerald-500" aria-hidden />
					Your taste
					{topVehicle ? <span className="text-muted-foreground">· {topVehicle.key} {Math.round(topVehicle.share * 100)}%</span> : null}
				</Button>
			</div>
		);
	}

	return (
		<div container-id="taste-panel" className="fixed bottom-4 left-4 z-40 w-[min(calc(100vw-2rem),20rem)] sm:bottom-6 sm:left-6">
			<Card size="sm" className="bg-background/95 shadow-xl backdrop-blur">
				<CardHeader>
					<CardTitle className="flex items-center gap-2 text-sm">
						<span className="size-2 animate-pulse rounded-full bg-emerald-500" aria-hidden />
						Your taste · live
					</CardTitle>
					<CardAction className="flex items-center gap-1">
						<Button
							variant="ghost"
							size="icon-sm"
							aria-label="Reset taste profile"
							disabled={profile.eventCount === 0}
							onClick={clearBehaviourEvents}
						>
							<RotateCcw />
						</Button>
						<Button variant="ghost" size="icon-sm" aria-label="Minimise taste panel" onClick={() => toggleCollapsed(true)}>
							<Minus />
						</Button>
					</CardAction>
				</CardHeader>

				<CardContent className="flex flex-col gap-3">
					{cold ? (
						<p className="text-xs text-muted-foreground">
							Open a few parts or set a budget — recommendations adapt instantly.
						</p>
					) : (
						<>
							{/* Vehicle affinity bars */}
							<div container-id="taste-panel-vehicles" className="flex flex-col gap-2">
								{profile.vehicles.slice(0, 3).map((vehicle) => (
									<div key={vehicle.key} className="flex flex-col gap-1">
										<div className="flex items-center justify-between text-xs">
											<span className="font-medium">{vehicle.key}</span>
											<span className="tabular-nums text-muted-foreground">{Math.round(vehicle.share * 100)}%</span>
										</div>
										<Progress value={Math.round(vehicle.share * 100)} aria-label={`${vehicle.key} affinity`} />
									</div>
								))}
							</div>

							{/* Part type they keep opening */}
							{topPart ? (
								<div container-id="taste-panel-part" className="flex items-center gap-1.5 text-xs">
									<Wrench className="size-3.5 text-muted-foreground" aria-hidden />
									<span className="font-medium">{topPart.key}</span>
									<span className="tabular-nums text-muted-foreground">{Math.round(topPart.share * 100)}%</span>
								</div>
							) : null}

							{/* Budget + condition */}
							<div container-id="taste-panel-budget" className="flex flex-wrap items-center gap-1.5 text-xs">
								{budget ? (
									<Badge variant={profile.budget.source === "filter" ? "default" : "secondary"} className="rounded-sm">
										<Wallet />
										{budget}
									</Badge>
								) : null}
								{topCondition ? (
									<Badge variant="secondary" className="rounded-sm">
										{CONDITION_LABELS[topCondition.key] ?? topCondition.key}
									</Badge>
								) : null}
								{profile.budget.source === "filter" ? (
									<span className="text-muted-foreground">hard filter</span>
								) : budget ? (
									<span className="text-muted-foreground">from views</span>
								) : null}
							</div>

							{/* AI read of intent (slow trigger) */}
							<div container-id="taste-panel-ai" className="flex items-start gap-2 rounded-md bg-muted/50 p-2 text-xs">
								<Sparkles className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden />
								<div className="flex flex-col gap-1">
									<span>{explaining && !explanation ? "Reading your intent…" : (explanation?.text ?? "Reading your intent…")}</span>
									{explanation ? (
										<span className="text-[10px] text-muted-foreground">via {modelLabel(explanation.model)}</span>
									) : null}
								</div>
							</div>
						</>
					)}

					{profile.lastEventLabel ? (
						<div className="flex items-center gap-1.5 text-xs text-muted-foreground">
							<MousePointerClick className="size-3.5 shrink-0" aria-hidden />
							<span className="truncate">{profile.lastEventLabel}</span>
						</div>
					) : null}
				</CardContent>

				{decision ? (
					<>
						<Separator />
						<CardFooter className="flex items-center justify-between gap-2 text-[11px] text-muted-foreground">
							<span className="flex items-center gap-1">
								<Gauge className="size-3.5" aria-hidden />
								Decided in {decision.decisionMs}ms
								<span className="opacity-70">({decision.roundTripMs}ms total)</span>
							</span>
							<Badge variant="outline" className="rounded-sm">
								{STRATEGY_LABELS[decision.strategy]}
							</Badge>
						</CardFooter>
					</>
				) : null}
			</Card>
		</div>
	);
}
