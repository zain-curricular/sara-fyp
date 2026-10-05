// ============================================================================
// Recommendations Feature — Config
// ============================================================================
//
// Tunables for the live recommendation engine. Weights are deliberately
// aggressive: the product requirement is that 2–3 views visibly reshape the
// feed, so recency decay is steep and vehicle affinity dominates the score.
//
// Model-per-trigger
// -----------------
//   every event          → deterministic scorer (no LLM, ~100ms)
//   intent shift / 3rd   → explanation model (Claude Haiku, else OpenAI mini)
//   chat questions       → the existing ShopSmart chatbot

/** Max events kept in the browser log (older ones fall off). */
export const MAX_EVENTS = 40;

/** localStorage key for the behaviour log. */
export const EVENTS_STORAGE_KEY = "ss:behaviour-events:v1";

/** Per-step recency multiplier: newest event ×1, next ×0.75, then ×0.56 … */
export const RECENCY_DECAY = 0.75;

/** Base weight of each event type before recency decay. */
export const EVENT_WEIGHTS = {
	view: 1,
	favorite: 2.5,
	filterVehicle: 2,
	filterPartType: 2,
} as const;

/** Soft budget band around the viewed-price target (±25%). */
export const SOFT_BUDGET_BAND = 0.25;

/** List caps for the profile — keeps the API payload small and bounded. */
export const PROFILE_LIMITS = {
	vehicles: 5,
	partTypes: 5,
	conditions: 3,
	viewedIds: 30,
} as const;

/** Score weights used by the server-side scorer. */
export const SCORE_WEIGHTS = {
	vehicle: 10,
	partType: 6,
	budget: 4,
	condition: 1.5,
	fresh: 0.5,
	inStock: 0.3,
} as const;

/** Vehicle share at or above which the vehicle is called out as a reason. */
export const VEHICLE_REASON_THRESHOLD = 0.25;

/** Candidate pool size scanned per decision (whole active catalogue today). */
export const CANDIDATE_POOL = 600;

/** Default number of recommendations returned. */
export const DEFAULT_RECOMMENDATION_LIMIT = 4;

/** Debounce between a behaviour event and the scoring request. */
export const RECOMMENDATION_DEBOUNCE_MS = 120;

/** Preferred explanation model (needs ANTHROPIC_API_KEY); override with RECS_EXPLANATION_MODEL. */
export const EXPLANATION_MODEL_ANTHROPIC = "claude-haiku-4-5";

/** Fallback explanation model when only OPENAI_API_KEY is set. */
export const EXPLANATION_MODEL_OPENAI = "gpt-4o-mini";

/** Ask the explanation model again after this many new view events. */
export const EXPLANATION_EVERY_N_EVENTS = 3;

/** Human labels for `listing_condition` values. */
export const CONDITION_LABELS: Record<string, string> = {
	oem: "OEM",
	aftermarket: "Aftermarket",
	used: "Used",
	refurbished: "Refurbished",
};

/**
 * Vehicle keywords for detecting the vehicle in titles and search queries.
 * Keys are canonical display names; values are lowercase phrases matched on
 * word boundaries. "city" alone is ambiguous, so Honda City needs "honda city".
 */
export const VEHICLE_KEYWORDS: Record<string, string[]> = {
	"Suzuki Mehran": ["mehran"],
	"Suzuki Alto": ["alto"],
	"Suzuki Cultus": ["cultus"],
	"Suzuki Swift": ["swift"],
	"Suzuki Wagon R": ["wagon r", "wagonr"],
	"Suzuki Bolan": ["bolan"],
	"Toyota Corolla": ["corolla"],
	"Toyota Vitz": ["vitz"],
	"Toyota Passo": ["passo"],
	"Toyota Yaris": ["yaris"],
	"Toyota Hilux": ["hilux"],
	"Toyota Fortuner": ["fortuner"],
	"Honda Civic": ["civic"],
	"Honda City": ["honda city"],
	"Honda BR-V": ["br-v", "brv"],
	"KIA Sportage": ["sportage"],
	"KIA Picanto": ["picanto"],
	"Hyundai Tucson": ["tucson"],
	"Hyundai Elantra": ["elantra"],
	"Hyundai Porter": ["porter"],
	"Daihatsu Mira": ["mira"],
	"Changan Alsvin": ["alsvin"],
	"Changan Oshan X7": ["oshan"],
	"Haval H6": ["haval", "h6"],
	"MG HS": ["mg hs"],
	"MG ZS": ["mg zs"],
	"Proton Saga": ["saga"],
	"Proton X70": ["x70"],
};

/** Part-type keywords (lowercase, singular/plural variants). */
export const PART_TYPE_KEYWORDS: Record<string, string[]> = {
	"Air Filter": ["air filter"],
	Alternator: ["alternator"],
	"Ball Joint": ["ball joint", "ball joints"],
	"Brake Disc": ["brake disc", "brake discs", "brake rotor", "brake rotors", "disc rotor", "disc rotors"],
	"Brake Pads": ["brake pad", "brake pads"],
	"Clutch Plate": ["clutch plate", "clutch"],
	ECU: ["ecu"],
	"Front Bumper": ["front bumper", "bumper"],
	"Fuel Filter": ["fuel filter"],
	"Fuel Injectors": ["fuel injector", "fuel injectors", "injector", "injectors"],
	Headlight: ["headlight", "headlights", "headlamp"],
	"Ignition Coil": ["ignition coil", "ignition coils"],
	"Oil Filter": ["oil filter"],
	"Piston Set": ["piston set", "piston", "pistons"],
	Radiator: ["radiator"],
	"Shock Absorber": ["shock absorber", "shock absorbers", "shocks"],
	"Spark Plugs": ["spark plug", "spark plugs"],
	"Timing Chain Kit": ["timing chain", "timing chain kit"],
	"Water Pump": ["water pump"],
	"Wheel Bearing": ["wheel bearing", "wheel bearings"],
};
