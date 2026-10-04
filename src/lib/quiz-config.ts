import { QuizStep } from "./types";

// ===== GATE QUESTION (comes first) =====
export const gateStep: QuizStep = {
  id: "ownsBox",
  question: "What do you need today?",
  subtitle: undefined,
  type: "select",
  options: [
    { label: "Build our puppy home", value: "no", description: "A safe box, warmth, and room to grow." },
    { label: "Care for our litter", value: "yes", description: "Helpful essentials for every puppy stage." },
  ],
};

// ===== NEW CUSTOMER PATH =====
// Data collection first (no routing effect), then structural routing

export const newCustomerDataSteps: QuizStep[] = [
  {
    id: "timeline",
    question: "Breeding timeline?",
    subtitle: "",
    type: "select",
    options: [
      { label: "Puppies not here yet", value: "preparing", description: "Getting ready" },
      { label: "Due within 7 days", value: "due_7_days", description: "Set up soon" },
      { label: "Just born (0–3 days)", value: "born_0_3", description: "Keep warm & safe" },
      { label: "1+ weeks old puppies", value: "born_1_plus", description: "Support growth" },
    ],
  },
  {
    id: "dueDate",
    question: "Expected due date?",
    subtitle: "Not sure? You can skip this step.",
    type: "date",
    optional: true,
    showIf: (data: any) => data.timeline === "preparing",
  },
  {
    id: "breed",
    question: "Dog breed",
    type: "breed",
  },
  {
    id: "damSize",
    question: "What size is your dam?",
    guidance: "Correct box sizing ensures the mother can stretch comfortably while keeping puppies safely contained.",
    type: "select",
    options: [
      { label: "Small: Under 16 lbs", value: "under_16", description: "Small breeds" },
      { label: "Medium: 16–40 lbs", value: "16_40", description: "Medium breeds" },
      { label: "Large: 40–90 lbs", value: "40_90", description: "Large breeds" },
      { label: "XL/Giant: 90+ lbs", value: "over_90", description: "Giant breeds" },
    ],
  },
  {
    id: "experience",
    question: "Breeding experience level?",
    type: "select",
    options: [
      { label: "First Litter", value: "first" },
      { label: "1–2 Litters", value: "1_2" },
      { label: "3–5 Litters", value: "3_5" },
      { label: "6+ Litters", value: "6_plus" },
    ],
  },
];

// Structural routing questions
export const spaceSetupStep: QuizStep = {
  id: "zones",
  question: "Litter space needed?",
  guidance: "Puppies grow fast — plan ahead.",
  type: "select",
  options: [
    { label: "Single whelping area", value: "1" },
    { label: "Whelping area + extra room", value: "2" },
    { label: "Full layout + extra room & mess hall", value: "3" },
  ],
};

export const step2AQuestion: QuizStep = {
  id: "branchAnswer",
  question: "Add breeder tools?",
  subtitle: undefined,
  guidance: "Useful during delivery and early care.",
  type: "select",
  options: [
    { label: "Box setup only", value: "false" },
    { label: "Include breeder tools", value: "true", description: "Whelping kit + collars + corner seat" },
  ],
};

export const step2BQuestion: QuizStep = {
  id: "branchAnswer",
  question: "Add smart monitoring?",
  guidance: "Remote monitoring adds peace of mind.",
  type: "select",
  options: [
    { label: "WiFi monitoring + alerts", value: "true" },
    { label: "Manual monitoring", value: "false" },
  ],
};

export const step2CQuestion: QuizStep = {
  id: "branchAnswer",
  question: "Do you want heating included in your setup?",
  guidance: "Newborn puppies cannot regulate body temperature well, especially in the first two weeks.",
  type: "select",
  options: [
    { label: "Yes, include heat combo", value: "true", description: "Keep puppies at safe temperatures" },
    { label: "No, I will handle heating separately", value: "false", description: "I have my own heating solution" },
  ],
};

export const damSizeStep: QuizStep = {
  id: "damSize",
  question: "What size is your dam?",
  guidance: "Correct box sizing ensures the mother can stretch comfortably while keeping puppies safely contained.",
  type: "select",
  options: [
    { label: "Small: Under 16 lbs", value: "under_16", description: "Small breeds" },
    { label: "Medium: 16–40 lbs", value: "16_40", description: "Medium breeds" },
    { label: "Large: 40–90 lbs", value: "40_90", description: "Large breeds" },
    { label: "XL/Giant: 90+ lbs", value: "over_90", description: "Giant breeds" },
  ],
};

export const containmentStep: QuizStep = {
  id: "containment",
  question: "What best describes your dog?",
  type: "select",
  options: [
    { label: "Calm & experienced", value: "calm", description: "Standard height walls" },
    { label: "Active, young, or first-time mom", value: "active", description: "Tall walls for extra safety" },
  ],
};

export const panelHeightStep: QuizStep = {
  id: "panelHeight",
  question: "Select panel height",
  guidance: "Extra height helps prevent escape attempts.",
  type: "select",
  options: [
    { label: "Standard (18\")", value: "18", description: "Best for most breeds" },
    { label: "Tall (28\")", value: "28", description: "Better for jumpers & large dams" },
  ],
};

// XL/Giant path only. Asked for every XL outcome; only changes routing for
// Play Yard (Window vs Solid add-on room / door). Answer is stored regardless.
export const windowStep: QuizStep = {
  id: "hasWindow",
  question: "Do you want a window panel on your box?",
  guidance: "A window panel lets you check on mom and puppies without opening the box. We'll match the right add-on room and door to your choice.",
  type: "select",
  options: [
    { label: "Yes, add a window", value: "yes", description: "Windowed panel for easy viewing" },
    { label: "No, keep it solid", value: "no", description: "Solid panels" },
  ],
};

// ===== EMAIL COLLECTION (last step before results, both paths) =====
export const emailStep: QuizStep = {
  id: "email",
  question: "Enter your email",
  subtitle: "We'll send your personalized recommendations and helpful breeder tips to your inbox. Unsubscribe anytime.",
  type: "email",
 
};

// ===== EXISTING CUSTOMER PATH =====
// Data collection first, then box config + stage

export const existingCustomerDataSteps: QuizStep[] = [
  {
    id: "breed",
    question: "Dog breed",
    type: "breed",
  },
  {
    id: "experience",
    question: "Breeding experience level?",
    type: "select",
    options: [
      { label: "First Litter", value: "first" },
      { label: "1–2 Litters", value: "1_2" },
      { label: "3–5 Litters", value: "3_5" },
      { label: "6+ Litters", value: "6_plus" },
    ],
  },
];

export const existingCustomerBoxSteps: QuizStep[] = [
  {
    id: "boxConfig",
    question: "Confirm your box",
    subtitle: "Select your size, then customize height and window style.",
    type: "boxConfig",
  },
  {
    id: "stage",
    question: "Where are you in your breeding timeline?",
    type: "select",
    options: [
      { label: "Preparing (not born yet)", value: "preparing" },
      { label: "Born 0–3 days", value: "born_0_3" },
      { label: "1–2 weeks old", value: "1_2_weeks" },
      { label: "3+ weeks old", value: "3_plus_weeks" },
    ],
  },
  {
    id: "dueDate",
    question: "Do you know your due date?",
    subtitle: "Optional — helps us time helpful reminders.",
    type: "date",
    optional: true,
    showIf: (data: any) => data.stage === "preparing",
  },
];
