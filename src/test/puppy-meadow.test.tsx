import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PuppyMeadow from "@/components/PuppyMeadow";
import { initialMeadowScene } from "@/lib/meadow-scene";

describe("Puppy meadow", () => {
  it("reveals the matching setup and resets it with the quiz", () => {
    const { rerender } = render(<PuppyMeadow count={4} scene={{ ...initialMeadowScene, breed: "Poodle", size: "over_90", stage: "sleeping", zones: 3, heating: true, complete: true }} />);
    expect(screen.getByLabelText("Whelping box")).toBeInTheDocument();
    expect(screen.getByLabelText("Play yard")).toBeInTheDocument();
    expect(screen.getByLabelText("Feeding area")).toBeInTheDocument();
    expect(screen.getByLabelText("Heat lamp included")).toBeInTheDocument();
    expect(screen.getByText("Poodle family")).toBeInTheDocument();
    rerender(<PuppyMeadow count={0} scene={initialMeadowScene} />);
    expect(screen.queryByLabelText("Heat lamp included")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Whelping box")).not.toBeInTheDocument();
  });

  it("adds puppies with progress and clears them on restart while keeping both adults", () => {
    const { rerender } = render(<PuppyMeadow count={0} />);
    expect(screen.queryAllByTestId("meadow-puppy")).toHaveLength(0);
    expect(screen.getByText("Mom")).toBeInTheDocument();
    expect(screen.getByText("Dad")).toBeInTheDocument();
    expect(screen.getByLabelText("Dad, the watchful protector")).toBeInTheDocument();
    expect(screen.getByLabelText("Mom, the gentle caretaker")).toBeInTheDocument();
    rerender(<PuppyMeadow count={3} />);
    expect(screen.getAllByTestId("meadow-puppy")).toHaveLength(3);
    rerender(<PuppyMeadow count={2} />);
    expect(screen.getAllByTestId("meadow-puppy")).toHaveLength(2);
    rerender(<PuppyMeadow count={0} />);
    expect(screen.queryAllByTestId("meadow-puppy")).toHaveLength(0);
    expect(screen.getByText("Mom")).toBeInTheDocument();
  });

  it("gives each puppy a different illustrated activity", () => {
    render(<PuppyMeadow count={6} />);
    ["sleeping", "eating", "jumping", "sitting", "playing with a ball", "stretching"].forEach((activity, index) => {
      expect(screen.getByLabelText(`Puppy ${index + 1}, ${activity}`)).toBeInTheDocument();
    });
    expect(document.querySelector(".puppy-bowl")).toBeInTheDocument();
    expect(document.querySelector(".puppy-ball")).toBeInTheDocument();
  });
});
