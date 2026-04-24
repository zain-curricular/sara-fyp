export type CatalogPlatform = "mobile" | "automotive";

export type Brand = {
	id: string;
	platform: CatalogPlatform;
	name: string;
	slug: string;
	logo_url: string | null;
	created_at: string;
	updated_at: string;
};

export type Model = {
	id: string;
	brand_id: string;
	category_id: string;
	name: string;
	slug: string;
	year: number | null;
	image_url: string | null;
	is_active: boolean;
	created_at: string;
	updated_at: string;
};

export type Specification = {
	id: string;
	model_id: string;
	specs: Record<string, unknown>;
	created_at: string;
	updated_at: string;
};

export type CatalogVariant = {
	key: string;
	value: string;
};

/** Public listing fields for catalog browse (matches `listings` columns we select). */
export type ListingSummary = {
	id: string;
	title: string;
	price: number;
	city: string;
	condition: string;
};
