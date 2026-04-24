// ============================================================================
// Bulk Upload Shell
// ============================================================================
//
// CSV template download, file picker, client-side parse + validate,
// row-by-row validation table, upload-all-valid button.
//
// CSV columns: title, category, condition, price, stock, description, city
// Parsing: native FileReader + simple CSV parser (no library needed).
// Upload: one POST /api/listings per valid row (sequential to avoid rate limits).

"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { AlertCircle, ArrowLeft, CheckCircle2, Download, Loader2, Upload } from "lucide-react";

import { Badge } from "@/components/primitives/badge";
import { Button } from "@/components/primitives/button";
import { buttonVariants } from "@/components/primitives/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/primitives/card";
import { Separator } from "@/components/primitives/separator";
import { cn } from "@/lib/utils";

// ----------------------------------------------------------------------------
// CSV template
// ----------------------------------------------------------------------------

const CSV_COLUMNS = ["title", "category", "condition", "price", "stock", "description", "city"] as const;
type CsvColumn = (typeof CSV_COLUMNS)[number];

const TEMPLATE_CSV =
	CSV_COLUMNS.join(",") +
	"\n" +
	'"Toyota Corolla Alternator","Engine Parts","good","8500","3","Genuine OEM alternator in good working condition","Karachi"\n' +
	'"Honda Civic Brake Discs","Brakes","excellent","4200","5","Set of 2 front brake discs, minimal wear","Lahore"';

const CONDITIONS = ["new", "like_new", "excellent", "good", "fair", "poor"] as const;

// ----------------------------------------------------------------------------
// CSV parser
// ----------------------------------------------------------------------------

/** Simple CSV parser — handles quoted fields with commas and escaped quotes. */
function parseCsvLine(line: string): string[] {
	const fields: string[] = [];
	let current = "";
	let inQuotes = false;

	for (let i = 0; i < line.length; i++) {
		const ch = line[i]!;
		if (ch === '"') {
			if (inQuotes && line[i + 1] === '"') {
				current += '"';
				i++;
			} else {
				inQuotes = !inQuotes;
			}
		} else if (ch === "," && !inQuotes) {
			fields.push(current.trim());
			current = "";
		} else {
			current += ch;
		}
	}

	fields.push(current.trim());
	return fields;
}

function parseCsv(text: string): Record<CsvColumn, string>[] {
	const lines = text
		.split(/\r?\n/)
		.map((l) => l.trim())
		.filter(Boolean);

	if (lines.length < 2) return [];

	// Skip header
	return lines.slice(1).map((line) => {
		const values = parseCsvLine(line);
		return CSV_COLUMNS.reduce(
			(obj, col, i) => {
				obj[col] = values[i] ?? "";
				return obj;
			},
			{} as Record<CsvColumn, string>,
		);
	});
}

// ----------------------------------------------------------------------------
// Validation
// ----------------------------------------------------------------------------

type ParsedRow = Record<CsvColumn, string> & {
	_rowIndex: number;
	_errors: string[];
};

function validateRow(row: Record<CsvColumn, string>, index: number): ParsedRow {
	const errors: string[] = [];

	if (!row.title || row.title.length < 3) errors.push("Title too short (min 3 chars)");
	if (!row.category) errors.push("Category is required");
	if (!CONDITIONS.includes(row.condition as (typeof CONDITIONS)[number])) {
		errors.push(`Condition must be one of: ${CONDITIONS.join(", ")}`);
	}

	const price = parseFloat(row.price);
	if (isNaN(price) || price <= 0) errors.push("Price must be a positive number");

	const stock = parseInt(row.stock, 10);
	if (isNaN(stock) || stock < 0) errors.push("Stock must be a non-negative integer");

	if (!row.city || row.city.length < 2) errors.push("City is required");

	return { ...row, _rowIndex: index, _errors: errors };
}

// ----------------------------------------------------------------------------
// Upload
// ----------------------------------------------------------------------------

type UploadStatus = "idle" | "uploading" | "done" | "partial";

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function BulkUploadShell() {
	const inputRef = useRef<HTMLInputElement>(null);
	const [rows, setRows] = useState<ParsedRow[]>([]);
	const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
	const [uploadResults, setUploadResults] = useState<
		{ index: number; ok: boolean; error?: string }[]
	>([]);
	const [busy, setBusy] = useState(false);

	// ----------------------------------------------------------------------------
	// File read + parse
	// ----------------------------------------------------------------------------

	function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
		const file = e.target.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (ev) => {
			const text = ev.target?.result as string;
			const parsed = parseCsv(text);
			const validated = parsed.map((row, i) => validateRow(row, i + 1));
			setRows(validated);
			setUploadStatus("idle");
			setUploadResults([]);
		};
		reader.readAsText(file);
	}

	// ----------------------------------------------------------------------------
	// Upload valid rows
	// ----------------------------------------------------------------------------

	async function handleUploadAll() {
		const validRows = rows.filter((r) => r._errors.length === 0);
		if (validRows.length === 0) return;

		setBusy(true);
		setUploadStatus("uploading");
		setUploadResults([]);

		const results: typeof uploadResults = [];

		for (const row of validRows) {
			try {
				const res = await fetch("/api/listings", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({
						platform: "automotive",
						title: row.title,
						description: row.description || null,
						condition: row.condition,
						price: parseFloat(row.price),
						city: row.city,
						sale_type: "fixed",
						is_negotiable: false,
						details: { stock: parseInt(row.stock, 10) },
						category_name: row.category,
					}),
				});

				const json = (await res.json()) as { ok: boolean; error?: string };
				results.push({ index: row._rowIndex, ok: json.ok, error: json.error });
			} catch {
				results.push({ index: row._rowIndex, ok: false, error: "Network error" });
			}
		}

		setUploadResults(results);
		const allOk = results.every((r) => r.ok);
		setUploadStatus(allOk ? "done" : "partial");
		setBusy(false);
	}

	// ----------------------------------------------------------------------------
	// Template download
	// ----------------------------------------------------------------------------

	function downloadTemplate() {
		const blob = new Blob([TEMPLATE_CSV], { type: "text/csv" });
		const url = URL.createObjectURL(blob);
		const a = document.createElement("a");
		a.href = url;
		a.download = "shopsmart-bulk-upload-template.csv";
		a.click();
		URL.revokeObjectURL(url);
	}

	// Derive counts
	const validCount = rows.filter((r) => r._errors.length === 0).length;
	const errorCount = rows.filter((r) => r._errors.length > 0).length;

	return (
		<div container-id="bulk-upload-shell" className="flex flex-col gap-6">

			{/* Header */}
			<header container-id="bulk-upload-header" className="flex flex-col gap-2">
				<Link
					href="/seller/listings"
					className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "w-fit gap-1.5 pl-0")}
				>
					<ArrowLeft className="size-3.5" aria-hidden />
					Back to listings
				</Link>
				<h1 className="text-3xl font-bold tracking-tight">Bulk upload</h1>
				<p className="text-sm text-muted-foreground">
					Upload multiple listings at once using a CSV file
				</p>
			</header>

			{/* Step 1: template */}
			<Card size="sm">
				<CardHeader>
					<CardTitle className="text-base">Step 1 — Download template</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					<p className="text-sm text-muted-foreground">
						Fill in the CSV template with your listing data.
						Required columns: <strong>{CSV_COLUMNS.join(", ")}</strong>.
					</p>
					<Button
						type="button"
						variant="outline"
						className="w-fit gap-1.5"
						onClick={downloadTemplate}
					>
						<Download className="size-4" aria-hidden />
						Download template
					</Button>
				</CardContent>
			</Card>

			{/* Step 2: upload */}
			<Card size="sm">
				<CardHeader>
					<CardTitle className="text-base">Step 2 — Upload your CSV</CardTitle>
				</CardHeader>
				<CardContent className="flex flex-col gap-3">
					<label
						htmlFor="csv-upload"
						className={cn(
							"flex w-fit cursor-pointer items-center gap-2 rounded-md border border-border px-3 py-2 text-sm font-medium",
							"hover:border-foreground/30",
						)}
					>
						<Upload className="size-4" aria-hidden />
						Choose CSV file
					</label>
					<input
						ref={inputRef}
						id="csv-upload"
						type="file"
						accept=".csv,text/csv"
						className="sr-only"
						onChange={handleFile}
					/>
					<p className="text-xs text-muted-foreground">
						UTF-8 encoded CSV. Condition values: {CONDITIONS.join(", ")}.
					</p>
				</CardContent>
			</Card>

			{/* Step 3: validation table */}
			{rows.length > 0 && (
				<Card size="sm">
					<CardHeader>
						<CardTitle className="text-base flex items-center gap-2">
							Step 3 — Review rows
							<div className="flex gap-1.5">
								<Badge variant="default" className="rounded-sm text-[10px]">
									{validCount} valid
								</Badge>
								{errorCount > 0 && (
									<Badge variant="outline" className="rounded-sm text-[10px] text-destructive">
										{errorCount} errors
									</Badge>
								)}
							</div>
						</CardTitle>
					</CardHeader>
					<CardContent className="flex flex-col gap-0 overflow-x-auto p-0">
						<table className="w-full min-w-[640px] text-xs">
							<thead className="border-b border-border bg-muted/30">
								<tr>
									<th className="px-3 py-2 text-left font-medium text-muted-foreground">#</th>
									<th className="px-3 py-2 text-left font-medium text-muted-foreground">Title</th>
									<th className="px-3 py-2 text-left font-medium text-muted-foreground">Category</th>
									<th className="px-3 py-2 text-left font-medium text-muted-foreground">Condition</th>
									<th className="px-3 py-2 text-left font-medium text-muted-foreground">Price</th>
									<th className="px-3 py-2 text-left font-medium text-muted-foreground">City</th>
									<th className="px-3 py-2 text-left font-medium text-muted-foreground">Status</th>
								</tr>
							</thead>
							<tbody>
								{rows.map((row, i) => {
									const hasError = row._errors.length > 0;
									const uploadResult = uploadResults.find((r) => r.index === row._rowIndex);

									return (
										<tr
											key={i}
											className={cn(
												"border-b border-border last:border-0",
												hasError ? "bg-destructive/5" : "bg-background",
											)}
										>
											<td className="px-3 py-2 text-muted-foreground">{row._rowIndex}</td>
											<td className="px-3 py-2 max-w-[140px] truncate">{row.title || "—"}</td>
											<td className="px-3 py-2">{row.category || "—"}</td>
											<td className="px-3 py-2">{row.condition || "—"}</td>
											<td className="px-3 py-2 tabular-nums">
												{row.price ? `Rs ${parseFloat(row.price).toLocaleString()}` : "—"}
											</td>
											<td className="px-3 py-2">{row.city || "—"}</td>
											<td className="px-3 py-2">
												{uploadResult ? (
													uploadResult.ok ? (
														<CheckCircle2 className="size-3.5 text-green-600" aria-label="Uploaded" />
													) : (
														<span className="text-destructive text-[10px]">
															{uploadResult.error ?? "Failed"}
														</span>
													)
												) : hasError ? (
													<div className="flex items-start gap-1">
														<AlertCircle className="mt-0.5 size-3 shrink-0 text-destructive" aria-hidden />
														<span className="text-destructive text-[10px]">
															{row._errors.join("; ")}
														</span>
													</div>
												) : (
													<CheckCircle2 className="size-3.5 text-green-600" aria-label="Valid" />
												)}
											</td>
										</tr>
									);
								})}
							</tbody>
						</table>
					</CardContent>
				</Card>
			)}

			{/* Upload button */}
			{rows.length > 0 && (
				<>
					<Separator />
					<div className="flex items-center justify-between gap-3">
						<p className="text-sm text-muted-foreground">
							{validCount} row{validCount !== 1 ? "s" : ""} ready to upload
							{errorCount > 0 && ` (${errorCount} with errors will be skipped)`}
						</p>
						<div className="flex items-center gap-3">
							{uploadStatus === "done" && (
								<span className="text-sm text-green-600">All rows uploaded!</span>
							)}
							{uploadStatus === "partial" && (
								<span className="text-sm text-amber-600">Some rows failed — check above</span>
							)}
							<Button
								type="button"
								disabled={busy || validCount === 0 || uploadStatus === "done"}
								onClick={() => void handleUploadAll()}
							>
								{busy ? (
									<>
										<Loader2 className="size-4 animate-spin" aria-hidden />
										Uploading…
									</>
								) : (
									`Upload ${validCount} valid row${validCount !== 1 ? "s" : ""}`
								)}
							</Button>
						</div>
					</div>
				</>
			)}
		</div>
	);
}
