// ============================================================================
// review-form.test
// ============================================================================
//
// Unit tests for ReviewForm: rating label focuses the slider, a11y wiring, and
// successful submit navigation.
//


import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { ReviewForm } from "../review-form";

const mocks = vi.hoisted(() => ({
	push: vi.fn(),
	submitReview: vi.fn(),
}));

vi.mock("next/navigation", () => ({
	useRouter: () => ({ push: mocks.push }),
}));

vi.mock("@/lib/features/reviews", async (importOriginal) => {
	const actual = await importOriginal<typeof import("@/lib/features/reviews")>();
	return {
		...actual,
		useSubmitReview: () => mocks.submitReview,
	};
});

describe("ReviewForm", () => {
	beforeEach(() => {
		mocks.push.mockClear();
		mocks.submitReview.mockReset();
		mocks.submitReview.mockResolvedValue({ ok: true });
	});

	const orderId = "550e8400-e29b-41d4-a716-446655440000";

	it("focuses the rating slider when the Rating label is clicked", async () => {
		render(<ReviewForm orderId={orderId} />);
		const slider = screen.getByRole("slider", { name: "Rating" });
		expect(slider).not.toHaveFocus();
		fireEvent.click(screen.getByText("Rating"));
		await waitFor(() => {
			expect(slider).toHaveFocus();
		});
	});

	it("wires aria-labelledby and aria-describedby on the slider", async () => {
		render(<ReviewForm orderId={orderId} />);
		const slider = screen.getByRole("slider", { name: "Rating" });
		await waitFor(() => {
			expect(slider).toHaveAttribute("aria-labelledby", "review-rating-label");
		});
		expect(slider).toHaveAttribute("aria-describedby", "review-rating-hint");
		expect(slider).toHaveAttribute("id", "review-rating-control");
	});

	it("submits the review and navigates to /buyer on success", async () => {
		render(<ReviewForm orderId={orderId} />);
		const slider = screen.getByRole("slider", { name: "Rating" });
		const row = within(slider).getByTestId("review-stars-segments");
		fireEvent.click(row.children[3]!);

		fireEvent.click(screen.getByRole("button", { name: "Submit review" }));

		await waitFor(() => {
			expect(mocks.submitReview).toHaveBeenCalledWith({
				order_id: orderId,
				rating: 4,
				comment: null,
			});
		});
		expect(mocks.push).toHaveBeenCalledWith("/buyer");
	});
});
