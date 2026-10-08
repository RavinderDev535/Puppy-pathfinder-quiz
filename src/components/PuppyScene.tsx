import movingDogs from "@/assets/quiz/moving-dogs-balanced.gif";

export default function PuppyScene() {
  return (
    <figure className="quiz-puppy-scene">
      <img
        className="quiz-puppy-motion"
        src={movingDogs}
        alt="Two golden dogs watching puppies in an EZWhelp pen"
        width={960}
        height={540}
        fetchPriority="high"
      />
    </figure>
  );
}
