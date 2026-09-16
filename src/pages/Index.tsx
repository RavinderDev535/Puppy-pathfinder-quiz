import { useState } from "react";
import EZWhelpQuiz from "@/components/EZWhelpQuiz";
import PuppyMeadow from "@/components/PuppyMeadow";
import "@/storybook.css";
import { initialMeadowScene } from "@/lib/meadow-scene";

export default function Index() {
  const [started, setStarted] = useState(false);
  const [puppies, setPuppies] = useState(0);
  const [scene, setScene] = useState(initialMeadowScene);
  return <main className={`storybook ${started ? "storybook-playing" : ""}`}>
    <div className="story-sun" aria-hidden="true" />
    <div className="story-cloud cloud-one" aria-hidden="true" />
    <div className="story-cloud cloud-two" aria-hidden="true" />
    <div className="story-cloud cloud-three" aria-hidden="true" />
    <header className="story-header">
      <span className="story-eyebrow">EZWHELP · A LITTLE ADVENTURE</span>
      <h1>PUPPY QUIZ</h1>
      <p>{started ? "Every answer brings a new puppy to the meadow." : "Help mom and dad build a happy home for their puppies"}</p>
    </header>
    {!started ? <section className="story-intro">
      <button className="wood-button" onClick={() => setStarted(true)}>ONCE UPON A TIME… <span>→</span></button>
      <p>A few questions. A growing puppy family.</p>
    </section> : <section className="story-questions" aria-label="Whelping setup quiz"><EZWhelpQuiz onPuppyProgress={setPuppies} onSceneChange={setScene} /></section>}
    <PuppyMeadow count={puppies} scene={scene} />
    <footer className="story-footer"><span>Made for little paws & big beginnings</span><span role="status" aria-live="polite">{puppies === 0 ? "Your story starts here" : `${puppies} ${puppies === 1 ? "puppy" : "puppies"} in your meadow`}</span></footer>
  </main>;
}
