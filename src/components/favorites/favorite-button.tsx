"use client";

import { Heart } from "lucide-react";

import { useToggleFavorite } from "@/lib/features/favorites";
import { Button } from "@/components/primitives/button";
import { cn } from "@/lib/utils";

type FavoriteButtonProps = {
	listingId: string;
	/** `icon-sm` on cards, `icon` on detail header */
	size?: "icon-sm" | "icon";
	className?: string;
};

export function FavoriteButton({ listingId, size = "icon", className }: FavoriteButtonProps) {
	const { isFavorited, isLoading, isPending, toggle, isSignedIn } = useToggleFavorite(listingId);

	const busy = isLoading || isPending;

	return (
		<Button
			type="button"
			variant="ghost"
			size={size}
			className={cn(className)}
			disabled={busy}
			onClick={() => void toggle()}
			aria-label={isSignedIn ? (isFavorited ? "Remove from favorites" : "Add to favorites") : "Sign in to save favorites"}
			aria-pressed={isFavorited}
		>
			<Heart
				className={cn(
					isFavorited ? "fill-primary text-primary" : "text-muted-foreground",
					busy && "opacity-60",
				)}
				aria-hidden
			/>
		</Button>
	);
}
