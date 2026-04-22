// ============================================================================
// Buyer Order Detail Page
// ============================================================================
//
// RSC entry point for /buyer/orders/[id]. No orders API exists yet — the shell
// renders static placeholder data keyed to the order ID. When the API ships,
// fetch the order here and pass as props.

import { notFound } from "next/navigation";

import OrderDetailShell from "./shell";

type PageProps = {
	params: Promise<{ id: string }>;
};

// Placeholder: accept any order ID that matches mock data format (A-XXXX).
const KNOWN_IDS = ["A-9421", "A-9388", "A-9212", "A-9144"];

export default async function BuyerOrderDetailPage({ params }: PageProps) {
	const { id } = await params;

	// Temporarily accept any ID to keep placeholder routes navigable.
	if (!KNOWN_IDS.includes(id) && !/^[A-Z]-\d+$/.test(id)) {
		notFound();
	}

	return <OrderDetailShell orderId={id} />;
}
