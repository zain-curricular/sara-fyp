// ============================================================================
// New Mechanic Request Shell — Client Component
// ============================================================================
//
// Form to request mechanic compatibility verification for a listing + vehicle.
// Displays listing info (read-only), vehicle picker, notes, fee disclosure,
// and fee agreement checkbox. Submits to POST /api/mechanic-requests.

"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
	createMechanicRequestSchema,
	type CreateMechanicRequestInput,
} from "@/lib/features/mechanic-requests";
import { useAuthenticatedFetch } from "@/lib/hooks/useAuthenticatedFetch";
import { formatPKR } from "@/lib/utils/currency";

import { Button } from "@/components/primitives/button";
import {
	Card,
	CardContent,
	CardHeader,
	CardTitle,
} from "@/components/primitives/card";
import {
	Field,
	FieldLabel,
	FieldError,
	FieldDescription,
} from "@/components/primitives/field";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/primitives/select";

// ----------------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------------

type Vehicle = {
	id: string;
	make: string;
	model: string;
	yearFrom: number;
	yearTo: number;
};

type ListingInfo = {
	id: string;
	title: string;
	imageUrl: string | null;
};

// ----------------------------------------------------------------------------
// Shell
// ----------------------------------------------------------------------------

export default function NewRequestShell({
	listing,
	vehicles,
}: {
	listing: ListingInfo;
	vehicles: Vehicle[];
}) {
	const router = useRouter();
	const authFetch = useAuthenticatedFetch();

	const {
		register,
		handleSubmit,
		control,
		formState: { errors, isSubmitting },
	} = useForm<CreateMechanicRequestInput>({
		resolver: zodResolver(createMechanicRequestSchema),
		defaultValues: {
			listingId: listing.id,
			notes: "",
			agreeToFee: undefined,
		},
	});

	async function onSubmit(values: CreateMechanicRequestInput) {
		try {
			const res = await authFetch<
				| { ok: true; data: { requestId: string } }
				| { ok: false; error: string }
			>("/api/mechanic-requests", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(values),
			});

			if (!res.ok) {
				throw new Error("error" in res ? res.error : "Failed to create request");
			}

			toast.success("Verification request submitted");
			router.push(`/buyer/mechanic-requests/${res.data.requestId}`);
		} catch (e) {
			toast.error(
				e instanceof Error ? e.message : "Failed to submit request",
			);
		}
	}

	return (
		<div
			container-id="new-request-shell"
			className="mx-auto flex max-w-2xl flex-col gap-8"
		>
			<header className="flex flex-col gap-1">
				<h1 className="text-2xl font-semibold tracking-tight">
					Request mechanic verification
				</h1>
				<p className="text-sm text-muted-foreground">
					A certified mechanic will verify if this part is compatible with your vehicle.
				</p>
			</header>

			{/* Listing preview (read-only) */}
			<Card size="sm">
				<CardHeader>
					<CardTitle>Part listing</CardTitle>
				</CardHeader>
				<CardContent className="flex items-center gap-3">
					{listing.imageUrl && (
						// eslint-disable-next-line @next/next/no-img-element
						<img
							src={listing.imageUrl}
							alt={listing.title}
							className="h-16 w-16 rounded-md border border-border object-cover"
						/>
					)}
					<p className="text-sm font-medium">{listing.title}</p>
				</CardContent>
			</Card>

			<form
				onSubmit={handleSubmit(onSubmit)}
				className="flex flex-col gap-6"
				container-id="mechanic-request-form"
			>
				{/* Hidden listingId */}
				<input type="hidden" {...register("listingId")} />

				{/* Vehicle selector */}
				<Controller
					control={control}
					name="vehicleId"
					render={({ field }) => (
						<Field data-invalid={!!errors.vehicleId || undefined}>
							<FieldLabel htmlFor="vehicleId">Your vehicle</FieldLabel>
							<Select onValueChange={field.onChange} value={field.value ?? ""}>
								<SelectTrigger id="vehicleId" className="w-full">
									<SelectValue placeholder="Select your vehicle…" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{vehicles.map((v) => (
											<SelectItem key={v.id} value={v.id}>
												{v.make} {v.model} ({v.yearFrom}–{v.yearTo})
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
							{errors.vehicleId && (
								<FieldError>{errors.vehicleId.message}</FieldError>
							)}
						</Field>
					)}
				/>

				{/* Notes */}
				<Field>
					<FieldLabel htmlFor="notes">Notes (optional)</FieldLabel>
					<textarea
						id="notes"
						rows={3}
						placeholder="Any additional context for the mechanic…"
						className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
						{...register("notes")}
					/>
				</Field>

				{/* Fee disclosure */}
				<div className="rounded-lg border border-border bg-muted/40 p-4 text-sm">
					<p className="font-medium">Verification fee</p>
					<p className="mt-1 text-muted-foreground">
						A one-time fee of{" "}
						<strong className="text-foreground">{formatPKR(500)}</strong> will
						be charged for this verification. Payment is collected separately.
					</p>
				</div>

				{/* Fee agreement */}
				<Field data-invalid={!!errors.agreeToFee || undefined}>
					<label className="flex items-start gap-2 cursor-pointer text-sm">
						<input
							type="checkbox"
							{...register("agreeToFee")}
							className="mt-0.5 size-4 rounded"
						/>
						<span>
							I agree to pay{" "}
							<strong>{formatPKR(500)}</strong> verification fee
						</span>
					</label>
					{errors.agreeToFee && (
						<FieldError>{errors.agreeToFee.message}</FieldError>
					)}
				</Field>

				{/* Actions */}
				<div className="flex gap-2">
					<Button type="submit" disabled={isSubmitting}>
						{isSubmitting ? "Submitting…" : "Submit request"}
					</Button>
					<Button
						type="button"
						variant="outline"
						onClick={() => router.push("/buyer/mechanic-requests")}
						disabled={isSubmitting}
					>
						Cancel
					</Button>
				</div>
			</form>
		</div>
	);
}
