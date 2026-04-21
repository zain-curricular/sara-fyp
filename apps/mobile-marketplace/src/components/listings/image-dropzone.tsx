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
			container-id="image-dropzone"
			className={cn(
				"flex min-h-40 flex-col items-center justify-center gap-3 rounded-2xl border border-dashed border-muted-foreground/40 bg-muted/30 px-4 py-8 text-center text-sm text-muted-foreground transition-colors",
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
			<p className="font-medium text-foreground">Drag a photo here</p>
			<p className="text-xs">JPEG, PNG, or WebP — or choose from device.</p>
			<label
				className={cn(
					buttonVariants({ variant: "outline", size: "sm" }),
					"mt-1 cursor-pointer",
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
