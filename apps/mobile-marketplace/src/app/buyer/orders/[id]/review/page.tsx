import { notFound, redirect } from "next/navigation";
import { z } from "zod";

import { fetchOrderDetailForReview } from "@/lib/features/reviews/services";
import { createServerSupabaseClient } from "@/lib/supabase/server";

import BuyerOrderReviewShell from "./shell";

const uuid = z.string().uuid();

type Props = { params: Promise<{ id: string }> };

export default async function BuyerOrderReviewPage({ params }: Props) {
	const { id } = await params;
	if (!uuid.safeParse(id).success) {
		notFound();
	}

	const supabase = await createServerSupabaseClient();
	const {
		data: { user },
		error: userError,
	} = await supabase.auth.getUser();
	if (userError || !user) {
		redirect("/login");
	}

	const detail = await fetchOrderDetailForReview(id);
	if (!detail) {
		redirect("/login");
	}

	if (detail.order.buyer_id !== user.id) {
		notFound();
	}

	if (detail.order.status !== "completed") {
		return <BuyerOrderReviewShell mode="not_completed" orderId={id} />;
	}

	return <BuyerOrderReviewShell mode="form" orderId={id} />;
}
