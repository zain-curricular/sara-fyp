import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import { ReviewStars } from "./review-stars";

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
		const { container } = render(<ReviewStars value={0} onChange={onChange} />);
		const star4 = container.querySelector('[data-star-index="4"]');
		expect(star4).toBeTruthy();
		fireEvent.click(star4!);
		expect(onChange).toHaveBeenCalledWith(4);
	});

	it("read-only mode has no slider", () => {
		render(<ReviewStars value={4} readOnly />);
		expect(screen.queryByRole("slider")).toBeNull();
		expect(screen.getByLabelText("Rating: 4 out of 5")).toBeInTheDocument();
	});
});
