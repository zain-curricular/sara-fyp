"use client";

import { useCallback, useState } from "react";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/primitives/button";

type ImageDropzoneProps = {
	onFile: (file: File) => void | Promise<void>;
	disabled?: boolean;
	className?: string;
};

export function ImageDropzone({ onFile, disabled, className }: ImageDropzoneProps) {
	const [isDragging, setIsDragging] = useState(false);

	const handleFiles = useCallback(
		async (files: FileList | null) => {
			const file = files?.[0];
			if (!file || disabled) return;
			await onFile(file);
		},
		[disabled, onFile],
	);

	return (
		<div
			className={cn(
				"flex min-h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-muted-foreground/40 bg-muted/30 p-4 text-center text-sm text-muted-foreground transition-colors",
				isDragging && "border-primary bg-primary/5 text-foreground",
				disabled && "pointer-events-none opacity-50",
				className,
			)}
			onDragOver={(e) => {
				e.preventDefault();
				setIsDragging(true);
			}}
			onDragLeave={() => setIsDragging(false)}
			onDrop={(e) => {
				e.preventDefault();
				setIsDragging(false);
				void handleFiles(e.dataTransfer.files);
			}}
		>
			<p>Drag a photo here, or choose a file.</p>
			<label
				className={cn(
					buttonVariants({ variant: "outline", size: "sm" }),
					disabled && "pointer-events-none opacity-50",
				)}
			>
				<input
					type="file"
					accept="image/jpeg,image/png,image/webp"
					className="sr-only"
					disabled={disabled}
					onChange={(e) => void handleFiles(e.target.files)}
				/>
				Choose image
			</label>
		</div>
	);
}
