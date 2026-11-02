import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ChipInput } from "@/components/ChipInput";

describe("ChipInput Component", () => {
  it("renders existing items as chips", () => {
    const items = ["Ganti Oli", "Tune Up"];
    render(<ChipInput items={items} onChange={() => {}} />);

    expect(screen.getByText("Ganti Oli")).toBeDefined();
    expect(screen.getByText("Tune Up")).toBeDefined();
  });

  it("calls onChange with new item when typing and clicking Tambah", () => {
    const onChange = vi.fn();
    render(<ChipInput items={["Ganti Oli"]} onChange={onChange} />);

    const input = screen.getByPlaceholderText("Ketik item lalu tekan Enter...");
    fireEvent.change(input, { target: { value: "Servis AC" } });

    const addButton = screen.getByRole("button", { name: /tambah/i });
    fireEvent.click(addButton);

    expect(onChange).toHaveBeenCalledWith(["Ganti Oli", "Servis AC"]);
  });

  it("calls onChange when Enter key is pressed", () => {
    const onChange = vi.fn();
    render(<ChipInput items={[]} onChange={onChange} />);

    const input = screen.getByPlaceholderText("Ketik item lalu tekan Enter...");
    fireEvent.change(input, { target: { value: "Spooring" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).toHaveBeenCalledWith(["Spooring"]);
  });

  it("calls onChange without the removed item when X is clicked", () => {
    const onChange = vi.fn();
    render(<ChipInput items={["Ganti Oli", "Tune Up"]} onChange={onChange} />);

    const removeBtn = screen.getByRole("button", { name: "Hapus Ganti Oli" });
    fireEvent.click(removeBtn);

    expect(onChange).toHaveBeenCalledWith(["Tune Up"]);
  });

  it("displays suggestions and adds them on click", () => {
    const onChange = vi.fn();
    render(
      <ChipInput
        items={["Ganti Oli"]}
        suggestions={["Ganti Oli", "Tune Up", "Servis AC"]}
        onChange={onChange}
      />,
    );

    // "Ganti Oli" should not be in suggestions because it's already an active item
    expect(screen.queryByRole("button", { name: "+ Ganti Oli" })).toBeNull();

    const tuneUpSuggestion = screen.getByRole("button", { name: /Tune Up/i });
    expect(tuneUpSuggestion).toBeDefined();

    fireEvent.click(tuneUpSuggestion);
    expect(onChange).toHaveBeenCalledWith(["Ganti Oli", "Tune Up"]);
  });

  it("prevents duplicate items (case-insensitive)", () => {
    const onChange = vi.fn();
    render(<ChipInput items={["Ganti Oli"]} onChange={onChange} />);

    const input = screen.getByPlaceholderText("Ketik item lalu tekan Enter...");
    fireEvent.change(input, { target: { value: "ganti oli" } });
    fireEvent.keyDown(input, { key: "Enter" });

    expect(onChange).not.toHaveBeenCalled();
  });
});
