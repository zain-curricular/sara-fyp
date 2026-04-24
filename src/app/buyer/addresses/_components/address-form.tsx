// ============================================================================
// Address Form — Shared Component
// ============================================================================
//
// React Hook Form + Zod form for creating and editing a saved address.
// Used by both /buyer/addresses/new and /buyer/addresses/[id]/edit shells.
// On success, redirects to /buyer/addresses.

"use client";

import { useRouter } from "next/navigation";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { addressSchema, type AddressInput } from "@/lib/features/addresses";
import {
	useCreateAddress,
	useUpdateAddress,
} from "@/lib/features/addresses";
import type { SavedAddress } from "@/lib/features/addresses";

import { Button } from "@/components/primitives/button";
import {
	Field,
	FieldLabel,
	FieldError,
	FieldDescription,
} from "@/components/primitives/field";
import { Input } from "@/components/primitives/input";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/primitives/select";

// ----------------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------------

const PAKISTAN_PROVINCES = [
	"Punjab",
	"Sindh",
	"Khyber Pakhtunkhwa",
	"Balochistan",
	"Islamabad Capital Territory",
	"Azad Jammu & Kashmir",
	"Gilgit-Baltistan",
];

// ----------------------------------------------------------------------------
// Props
// ----------------------------------------------------------------------------

type AddressFormProps =
	| { mode: "create" }
	| { mode: "edit"; address: SavedAddress };

// ----------------------------------------------------------------------------
// Component
// ----------------------------------------------------------------------------

export function AddressForm(props: AddressFormProps) {
	const router = useRouter();
	const createAddress = useCreateAddress();
	const updateAddress = useUpdateAddress();

	const defaultValues: AddressInput =
		props.mode === "edit"
			? {
					label: props.address.label,
					fullName: props.address.fullName,
					phone: props.address.phone,
					addressLine: props.address.addressLine,
					city: props.address.city,
					province: props.address.province,
					isDefault: props.address.isDefault,
				}
			: {
					label: "Home",
					fullName: "",
					phone: "",
					addressLine: "",
					city: "",
					province: "",
					isDefault: false,
				};

	const form = useForm<AddressInput>({
		resolver: zodResolver(addressSchema),
		defaultValues,
	});

	const {
		register,
		handleSubmit,
		control,
		formState: { errors, isSubmitting },
	} = form;

	async function onSubmit(values: AddressInput) {
		if (props.mode === "create") {
			createAddress.mutate(values, {
				onSuccess: () => {
					toast.success("Address saved");
					router.push("/buyer/addresses");
					router.refresh();
				},
				onError: (e) => toast.error(e.message),
			});
		} else {
			updateAddress.mutate(
				{ addressId: props.address.id, ...values },
				{
					onSuccess: () => {
						toast.success("Address updated");
						router.push("/buyer/addresses");
						router.refresh();
					},
					onError: (e) => toast.error(e.message),
				},
			);
		}
	}

	const isPending = createAddress.isPending || updateAddress.isPending;

	return (
		<form
			onSubmit={handleSubmit(onSubmit)}
			className="flex flex-col gap-6"
			container-id="address-form"
		>
			{/* Label */}
			<Field data-invalid={!!errors.label || undefined}>
				<FieldLabel htmlFor="label">Label</FieldLabel>
				<Input id="label" placeholder="Home" {...register("label")} />
				<FieldDescription>
					E.g. Home, Office, Parents' house
				</FieldDescription>
				{errors.label && <FieldError>{errors.label.message}</FieldError>}
			</Field>

			{/* Full name */}
			<Field data-invalid={!!errors.fullName || undefined}>
				<FieldLabel htmlFor="fullName">Full name</FieldLabel>
				<Input
					id="fullName"
					placeholder="Muhammad Ahmed"
					{...register("fullName")}
				/>
				{errors.fullName && (
					<FieldError>{errors.fullName.message}</FieldError>
				)}
			</Field>

			{/* Phone */}
			<Field data-invalid={!!errors.phone || undefined}>
				<FieldLabel htmlFor="phone">Phone number</FieldLabel>
				<Input
					id="phone"
					type="tel"
					placeholder="03001234567"
					{...register("phone")}
				/>
				<FieldDescription>Pakistani mobile number</FieldDescription>
				{errors.phone && <FieldError>{errors.phone.message}</FieldError>}
			</Field>

			{/* Address line */}
			<Field data-invalid={!!errors.addressLine || undefined}>
				<FieldLabel htmlFor="addressLine">Address</FieldLabel>
				<Input
					id="addressLine"
					placeholder="House 12, Street 5, Block B"
					{...register("addressLine")}
				/>
				{errors.addressLine && (
					<FieldError>{errors.addressLine.message}</FieldError>
				)}
			</Field>

			{/* City + Province row */}
			<div className="grid grid-cols-2 gap-3">
				<Field data-invalid={!!errors.city || undefined}>
					<FieldLabel htmlFor="city">City</FieldLabel>
					<Input id="city" placeholder="Lahore" {...register("city")} />
					{errors.city && <FieldError>{errors.city.message}</FieldError>}
				</Field>

				<Controller
					control={control}
					name="province"
					render={({ field }) => (
						<Field data-invalid={!!errors.province || undefined}>
							<FieldLabel htmlFor="province">Province</FieldLabel>
							<Select
								onValueChange={field.onChange}
								value={field.value ?? ""}
							>
								<SelectTrigger id="province" className="w-full">
									<SelectValue placeholder="Select…" />
								</SelectTrigger>
								<SelectContent>
									<SelectGroup>
										{PAKISTAN_PROVINCES.map((p) => (
											<SelectItem key={p} value={p}>
												{p}
											</SelectItem>
										))}
									</SelectGroup>
								</SelectContent>
							</Select>
							{errors.province && (
								<FieldError>{errors.province.message}</FieldError>
							)}
						</Field>
					)}
				/>
			</div>

			{/* Default checkbox */}
			<Field>
				<label className="flex items-center gap-2 cursor-pointer text-sm">
					<input type="checkbox" {...register("isDefault")} className="size-4 rounded" />
					Set as default address
				</label>
			</Field>

			{/* Actions */}
			<div className="flex gap-2">
				<Button type="submit" disabled={isSubmitting || isPending}>
					{isPending ? "Saving…" : props.mode === "create" ? "Save address" : "Update address"}
				</Button>
				<Button
					type="button"
					variant="outline"
					onClick={() => router.push("/buyer/addresses")}
					disabled={isSubmitting || isPending}
				>
					Cancel
				</Button>
			</div>
		</form>
	);
}
