import { notFound } from "next/navigation";

import OrderDetailShell from "./shell";

type PageProps = {
	params: Promise<{ id: string }>;
};

const KNOWN_IDS = ["A-9421", "A-9388", "A-9212", "A-9144"];

export default async function BuyerOrderDetailPage({ params }: PageProps) {
	const { id } = await params;

	if (!KNOWN_IDS.includes(id) && !/^[A-Z]-\d+$/.test(id)) {
		notFound();
	}

	return <OrderDetailShell orderId={id} />;
}
