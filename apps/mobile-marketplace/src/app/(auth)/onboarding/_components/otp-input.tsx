"use client";

import { Input } from "@/components/primitives/input";
import { cn } from "@/lib/utils";

type Props = {
	id?: string;
	value: string;
	onChange: (digits: string) => void;
	disabled?: boolean;
	className?: string;
	"aria-invalid"?: boolean;
};

/** Six-digit code: single numeric field with paste support (spacing for readability). */
export function OtpInput({ id, value, onChange, disabled, className, ...rest }: Props) {
	function sanitize(raw: string) {
		return raw.replace(/\D/g, "").slice(0, 6);
	}

	return (
		<Input
			{...rest}
			autoComplete="one-time-code"
			className={cn(
				"text-center font-mono text-2xl tracking-[0.5em] tabular-nums sm:text-3xl",
				className,
			)}
			disabled={disabled}
			id={id}
			inputMode="numeric"
			maxLength={6}
			pattern="\d{6}"
			placeholder="000000"
			type="text"
			value={value}
			onChange={(e) => onChange(sanitize(e.target.value))}
			onPaste={(e) => {
				e.preventDefault();
				const t = e.clipboardData.getData("text");
				onChange(sanitize(t));
			}}
		/>
	);
}
