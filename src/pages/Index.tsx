import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ArrowRight, House, PackagePlus } from "lucide-react";
import EZWhelpQuiz from "@/components/EZWhelpQuiz";
import PuppyScene from "@/components/PuppyScene";
import "@/quiz-layout.css";

export default function Index() {
  const [params] = useSearchParams();
  const location = useLocation();
  const path = params.get("path");
  const showQuiz = location.pathname === "/quiz" || path === "new" || path === "existing";
  const initialPath = path === "existing" ? "existing" : "new";
  return (
    <main className="quiz-page">
      <svg className="quiz-paw-pattern" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <defs><pattern id="quiz-paws" width="140" height="140" patternUnits="userSpaceOnUse"><text x="35" y="70" fontSize="24" fill="#8B7D6B">🐾</text></pattern></defs>
        <rect width="100%" height="100%" fill="url(#quiz-paws)" />
      </svg>
      {showQuiz ? (
        <section className="quiz-page-content" aria-label="Find your whelping setup">
          <EZWhelpQuiz key={initialPath} initialPath={initialPath} />
        </section>
      ) : (
        <section className="quiz-home">
          <div className="quiz-home-scene"><PuppyScene /></div>
          <h1>Whelping <span>Made Easy</span></h1>
          <p>Pick where you want to start.</p>
          <div className="quiz-home-paths">
            <span className="quiz-home-label">Build a new setup</span>
            <Link to="/quiz?path=new" className="quiz-home-link">
              <PackagePlus aria-hidden="true" />
              <span><strong>Build My Perfect Bundle</strong><small>Complete setup, sized to your mama</small></span>
              <ArrowRight aria-hidden="true" />
            </Link>
            <span className="quiz-home-label">I already own a box</span>
            <Link to="/quiz?path=existing" className="quiz-home-link">
              <House aria-hidden="true" />
              <span><strong>I Already Have an EZWhelp Box</strong><small>Add-ons that fit it</small></span>
              <ArrowRight aria-hidden="true" />
            </Link>
          </div>
          <a className="quiz-support" href="mailto:support@ezwhelp.com">Need a hand? support@ezwhelp.com</a>
        </section>
      )}
    </main>
  );
}
