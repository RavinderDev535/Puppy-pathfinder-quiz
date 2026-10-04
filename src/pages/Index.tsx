import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ArrowRight, Gift, House, PackagePlus, RefreshCcw, Box, Wrench } from "lucide-react";
import EZWhelpQuiz from "@/components/EZWhelpQuiz";
import SingleBoxQuiz from "@/components/quiz-lanes/SingleBoxQuiz";
import GiftQuiz from "@/components/quiz-lanes/GiftQuiz";
import RestockQuiz from "@/components/quiz-lanes/RestockQuiz";
import UpgradeQuiz from "@/components/quiz-lanes/UpgradeQuiz";
import PuppyScene from "@/components/PuppyScene";
import "@/quiz-layout.css";
import "@/quiz-lanes.css";

export default function Index() {
  const [params] = useSearchParams();
  const location = useLocation();
  const path = params.get("path");
  const quiz = params.get("quiz");
  const showQuiz = location.pathname === "/quiz" || path === "new" || path === "existing" || Boolean(quiz);
  const initialPath = path === "existing" || quiz === "restock" || quiz === "upgrade" ? "existing" : "new";
  const choices = [
    { label: "Build a new setup", items: [
      { title: "Build My Perfect Bundle", subtitle: "Complete setup, sized to your mama", to: "/quiz?path=new", icon: PackagePlus, tone: "peach" },
      { title: "EZclassic Single Box quiz", subtitle: "One EZclassic box", to: "/quiz?quiz=ezclassic", icon: Box, tone: "sage" },
      { title: "Fab System Single Box quiz", subtitle: "One Fab System box", to: "/quiz?quiz=fab", icon: Box, tone: "green" },
    ] },
    { label: "I already own a box", items: [
      { title: "I Already Have an EZWhelp Box", subtitle: "Add-ons that fit it", to: "/quiz?path=existing", icon: House, tone: "sage" },
      { title: "Restock & repair", subtitle: "Pads, liners, parts", to: "/quiz?quiz=restock", icon: RefreshCcw, tone: "peach" },
      { title: "Upgrade my setup", subtitle: "Bigger mama or more litters", to: "/quiz?quiz=upgrade", icon: Wrench, tone: "peach" },
    ] },
    { label: "Gifting", items: [
      { title: "Gift a breeder", subtitle: "Gift cards and gift-ready pieces", to: "/quiz?quiz=gift", icon: Gift, tone: "sage" },
    ] },
  ];
  return (
    <main className="quiz-page">
      <svg className="quiz-paw-pattern" aria-hidden="true" xmlns="http://www.w3.org/2000/svg">
        <defs><pattern id="quiz-paws" width="140" height="140" patternUnits="userSpaceOnUse"><text x="35" y="70" fontSize="24" fill="#8B7D6B">🐾</text></pattern></defs>
        <rect width="100%" height="100%" fill="url(#quiz-paws)" />
      </svg>
      {showQuiz ? (
        <section className="quiz-page-content" aria-label="Find your whelping setup">
          {quiz === "fab" || quiz === "ezclassic" ? <SingleBoxQuiz key={quiz} system={quiz} /> : quiz === "gift" ? <GiftQuiz /> : quiz === "restock" ? <RestockQuiz /> : quiz === "upgrade" ? <UpgradeQuiz /> : <EZWhelpQuiz key={initialPath} initialPath={initialPath} />}
        </section>
      ) : (
        <section className="quiz-home">
          <div className="quiz-home-scene"><PuppyScene /></div>
          <h1>Whelping <span>Made Easy</span></h1>
          <p>Pick where you want to start.</p>
          <div className="quiz-home-paths">
            {choices.map((group) => (
              <div className="quiz-home-group" key={group.label}>
                <span className="quiz-home-label">{group.label}</span>
                {group.items.map(({ title, subtitle, to, icon: Icon, tone }) => (
                  <Link to={to} className="quiz-home-link" key={title}>
                    <Icon className={`quiz-home-icon quiz-home-icon-${tone}`} aria-hidden="true" />
                    <span><strong>{title}</strong><small>{subtitle}</small></span>
                    <ArrowRight aria-hidden="true" />
                  </Link>
                ))}
              </div>
            ))}
          </div>
          <a className="quiz-support" href="mailto:support@ezwhelp.com">Need a hand? support@ezwhelp.com</a>
        </section>
      )}
    </main>
  );
}
