import { notFound } from "next/navigation";
import { z } from "zod";

import { fetchSellerPublicPagePayload } from "@/lib/features/reviews/services";

import SellerPublicShell from "./shell";

const uuid = z.string().uuid();

type Props = { params: Promise<{ id: string }> };

export default async function SellerPublicPage({ params }: Props) {
	const { id } = await params;
	if (!uuid.safeParse(id).success) {
		notFound();
	}

	const payload = await fetchSellerPublicPagePayload(id);
	if (!payload) {
		notFound();
	}

	return <SellerPublicShell profile={payload.profile} reviewsInitial={payload.reviewsInitial} />;
}
