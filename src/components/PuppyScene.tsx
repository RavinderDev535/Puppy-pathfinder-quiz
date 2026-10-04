import { useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { Pause, Play } from "lucide-react";
import puppyPoster from "@/assets/quiz/puppy-family.png";
import puppyVideo from "@/assets/quiz/puppy-family.mp4";

export default function PuppyScene() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const reducedMotion = useReducedMotion();
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [ready, setReady] = useState(false);

  return (
    <figure className="quiz-puppy-scene">
      <img src={puppyPoster} alt="Two golden dogs watching their puppies play in an EZWhelp pen" width={1200} height={896} fetchPriority="high" />
      {!failed && <>
        <video
          className={`quiz-puppy-motion${ready ? " quiz-puppy-motion-ready" : ""}`}
          ref={videoRef} src={puppyVideo} poster={puppyPoster}
          width={1920} height={1080}
          autoPlay={!reducedMotion} muted loop playsInline
          preload={reducedMotion ? "none" : "auto"}
          aria-label="Dogs and puppies moving and playing in their EZWhelp pen"
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onError={() => setFailed(true)}
          onLoadedData={() => setReady(true)}
        />
        <button type="button" className="quiz-scene-control"
          aria-label={playing ? "Pause puppy animation" : "Play puppy animation"}
          onClick={() => {
            const video = videoRef.current;
            if (!video) return;
            if (video.paused) void video.play().catch(() => setPlaying(false));
            else video.pause();
          }}>
          {playing ? <Pause size={16} aria-hidden="true" /> : <Play size={16} aria-hidden="true" />}
        </button>
      </>}
    </figure>
  );
}
