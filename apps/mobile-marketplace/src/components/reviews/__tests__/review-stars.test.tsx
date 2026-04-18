import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";

import { ReviewStars } from "../review-stars";

describe("ReviewStars", () => {
	it("exposes slider semantics when interactive", () => {
		const onChange = vi.fn();
		render(<ReviewStars value={3} onChange={onChange} />);
		const slider = screen.getByRole("slider", { name: "Rating" });
		expect(slider).toHaveAttribute("aria-valuenow", "3");
		expect(slider).toHaveAttribute("aria-valuetext", "3 out of 5 stars");
	});

	it("increments via ArrowRight", () => {
		const onChange = vi.fn();
		render(<ReviewStars value={2} onChange={onChange} />);
		const slider = screen.getByRole("slider", { name: "Rating" });
		fireEvent.keyDown(slider, { key: "ArrowRight" });
		expect(onChange).toHaveBeenCalledWith(3);
	});

	it("sets rating via click on star segment (pointer only; keyboard stays on slider)", () => {
		const onChange = vi.fn();
		render(<ReviewStars value={0} onChange={onChange} />);
		const slider = screen.getByRole("slider", { name: "Rating" });
		const row = within(slider).getByTestId("review-stars-segments");
		expect(row.children.length).toBe(5);
		fireEvent.click(row.children[3]!);
		expect(onChange).toHaveBeenCalledWith(4);
	});

	it("links optional description for assistive tech", () => {
		render(<ReviewStars value={1} onChange={vi.fn()} ariaDescribedBy="review-rating-hint" />);
		expect(screen.getByRole("slider", { name: "Rating" })).toHaveAttribute(
			"aria-describedby",
			"review-rating-hint",
		);
	});

	it("uses aria-labelledby instead of aria-label when labelId is set", () => {
		render(
			<>
				<span id="rating-lbl">Rating</span>
				<ReviewStars value={2} onChange={vi.fn()} id="rating-ctrl" labelId="rating-lbl" />
			</>,
		);
		const slider = screen.getByRole("slider", { name: "Rating" });
		expect(slider).toHaveAttribute("aria-labelledby", "rating-lbl");
		expect(slider).toHaveAttribute("id", "rating-ctrl");
		expect(slider).not.toHaveAttribute("aria-label");
	});

	it("falls back to aria-label when labelId has no matching element", async () => {
		render(<ReviewStars value={2} onChange={vi.fn()} labelId="does-not-exist" />);
		await waitFor(() => {
			const slider = screen.getByRole("slider", { name: "Rating" });
			expect(slider).not.toHaveAttribute("aria-labelledby", "does-not-exist");
		});
		expect(screen.getByRole("slider", { name: "Rating" })).toHaveAttribute("aria-label", "Rating");
	});

	it("read-only mode has no slider", () => {
		render(<ReviewStars value={4} readOnly />);
		expect(screen.queryByRole("slider")).toBeNull();
		expect(screen.getByLabelText("Rating: 4 out of 5")).toBeInTheDocument();
	});
});
