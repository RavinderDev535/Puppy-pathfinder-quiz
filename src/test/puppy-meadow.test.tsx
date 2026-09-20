import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import PuppyMeadow from "@/components/PuppyMeadow";
import { initialMeadowScene } from "@/lib/meadow-scene";

describe("Puppy meadow", () => {
  it("keeps existing puppies anchored while every later step adds a distinct puppy", () => {
    const { rerender } = render(<PuppyMeadow count={1} showQuizKennel />);
    const first = screen.getAllByTestId("meadow-puppy")[0];
    const position = first.getAttribute("style");
    for (let count = 2; count <= 12; count++) {
      rerender(<PuppyMeadow count={count} showQuizKennel />);
      const puppies = screen.getAllByTestId("meadow-puppy");
      expect(puppies).toHaveLength(count);
      expect(document.querySelector('[data-puppy-id="0"]')).toBe(first);
      expect(first.getAttribute("style")).toBe(position);
      expect(new Set(puppies.map(p => `${p.querySelector("img")?.getAttribute("src")}-${p.dataset.coat}`)).size).toBe(count);
    }
  });

  it("places two puppies inside the middle container with their own depth layer", () => {
    render(<PuppyMeadow count={6} showQuizKennel />);
    expect(document.querySelectorAll('.kennel-nursery-puppies [data-pen="box"]')).toHaveLength(2);
    expect(document.querySelectorAll('[data-pen="yard"]')).toHaveLength(4);
  });

  it("shows selected accessories and removes them when answers change", () => {
    const { rerender } = render(<PuppyMeadow count={4} showQuizKennel scene={{ ...initialMeadowScene, tools: true, stage: "sleeping" }} />);
    expect(screen.getByLabelText("Breeder care kit")).toBeInTheDocument();
    expect(screen.getByLabelText("Fresh blankets for the nursery")).toBeInTheDocument();
    rerender(<PuppyMeadow count={4} showQuizKennel scene={{ ...initialMeadowScene, monitoring: true, zones: 2 }} />);
    expect(screen.queryByLabelText("Breeder care kit")).not.toBeInTheDocument();
    expect(screen.queryByLabelText("Fresh blankets for the nursery")).not.toBeInTheDocument();
    expect(screen.getByLabelText("WiFi puppy monitor")).toBeInTheDocument();
    expect(screen.getByLabelText("Playtime toys")).toBeInTheDocument();
    expect(screen.queryByLabelText("Feeding area")).not.toBeInTheDocument();
  });

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
    ["sleeping", "eating", "jumping", "sitting", "playing with a ball", "stretching"].forEach((activity) => {
      expect(screen.getByLabelText(new RegExp(`Puppy \\d+, ${activity}`))).toBeInTheDocument();
    });
    expect(document.querySelector(".puppy-bowl")).toBeInTheDocument();
    expect(document.querySelector(".puppy-ball")).toBeInTheDocument();
  });

  it("shows the kennel from the first quiz step and adds puppies inside it", () => {
    const { rerender } = render(<PuppyMeadow count={0} scene={initialMeadowScene} showQuizKennel />);
    expect(document.querySelector(".kennel-stage .kennel-back")).toBeInTheDocument();
    expect(document.querySelectorAll(".kennel-stage .puppy-arrival")).toHaveLength(0);
    rerender(<PuppyMeadow count={3} scene={{ ...initialMeadowScene, stage: "playful", zones: 1 }} showQuizKennel />);
    expect(screen.getByLabelText("Family play yard")).toBeInTheDocument();
    expect(screen.getByLabelText("Whelping box")).toBeInTheDocument();
    expect(document.querySelector(".kennel-stage .kennel-back")).toBeInTheDocument();
    expect(document.querySelectorAll(".kennel-stage .puppy-arrival")).toHaveLength(3);
  });
});
