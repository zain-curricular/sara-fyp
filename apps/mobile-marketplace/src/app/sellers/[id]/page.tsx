import { notFound } from "next/navigation";
import { z } from "zod";

import { fetchPublicProfile } from "@/lib/features/profiles/fetch-public-profile";

import SellerPublicShell from "./shell";

const uuid = z.string().uuid();

type Props = { params: Promise<{ id: string }> };

export default async function SellerPublicPage({ params }: Props) {
	const { id } = await params;
	if (!uuid.safeParse(id).success) {
		notFound();
	}

	const profile = await fetchPublicProfile(id);
	if (!profile) {
		notFound();
	}

	return <SellerPublicShell profile={profile} />;
}
