export interface AvatarPreset {
  id: string;
  label: string;
  category: "cat" | "human";
  url: string;
}

function makeCatAvatar(bgColor: string, accentColor: string, label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="54" r="38" fill="${bgColor}"/>
    <polygon points="20,40 32,15 48,32" fill="${bgColor}"/>
    <polygon points="80,40 68,15 52,32" fill="${bgColor}"/>
    <polygon points="24,36 33,20 44,32" fill="${accentColor}"/>
    <polygon points="76,36 67,20 56,32" fill="${accentColor}"/>
    <circle cx="38" cy="50" r="5" fill="#0f172a"/>
    <circle cx="62" cy="50" r="5" fill="#0f172a"/>
    <circle cx="39.5" cy="48.5" r="1.5" fill="#ffffff"/>
    <circle cx="63.5" cy="48.5" r="1.5" fill="#ffffff"/>
    <polygon points="50,56 46,61 54,61" fill="${accentColor}"/>
    <path d="M46 62 Q50 67 54 62" stroke="#0f172a" stroke-width="2" fill="none"/>
    <text x="50" y="85" font-family="system-ui, sans-serif" font-size="9" font-weight="bold" fill="#ffffff" text-anchor="middle">${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

function makeHumanAvatar(bgColor: string, initials: string, label: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="48" fill="${bgColor}"/>
    <text x="50" y="58" font-family="system-ui, sans-serif" font-size="28" font-weight="bold" fill="#ffffff" text-anchor="middle">${initials}</text>
    <text x="50" y="82" font-family="system-ui, sans-serif" font-size="9" font-weight="600" fill="#ffffff" fill-opacity="0.9" text-anchor="middle">${label}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  // Mascot Personas (Clean Self-Contained SVG Vector Avatars)
  {
    id: "cat_tabby",
    label: "Admin Felix (Tabby)",
    category: "cat",
    url: makeCatAvatar("#f59e0b", "#fde68a", "ADMIN"),
  },
  {
    id: "cat_ginger",
    label: "Ginger Whiskers",
    category: "cat",
    url: makeCatAvatar("#ea580c", "#ffedd5", "ITIL"),
  },
  {
    id: "cat_tuxedo",
    label: "Tuxedo Commander",
    category: "cat",
    url: makeCatAvatar("#334155", "#e2e8f0", "OPS"),
  },
  {
    id: "cat_white",
    label: "White Snowball",
    category: "cat",
    url: makeCatAvatar("#0284c7", "#e0f2fe", "CAB"),
  },
  {
    id: "cat_siamese",
    label: "Siamese Specialist",
    category: "cat",
    url: makeCatAvatar("#64748b", "#cbd5e1", "DEV"),
  },
  {
    id: "cat_calico",
    label: "Calico SRE",
    category: "cat",
    url: makeCatAvatar("#10b981", "#d1fae5", "SRE"),
  },

  // Professional Humans (Clean Vector Avatars)
  {
    id: "human_governance",
    label: "Governance Chair (Marcus)",
    category: "human",
    url: makeHumanAvatar("#4f46e5", "MV", "Marcus"),
  },
  {
    id: "human_incident",
    label: "Incident Lead (Sarah)",
    category: "human",
    url: makeHumanAvatar("#059669", "SJ", "Sarah"),
  },
  {
    id: "human_architect",
    label: "Staff Architect (Alex)",
    category: "human",
    url: makeHumanAvatar("#0284c7", "AC", "Alex"),
  },
  {
    id: "human_analyst",
    label: "Support Analyst (Elena)",
    category: "human",
    url: makeHumanAvatar("#d97706", "ER", "Elena"),
  },
  {
    id: "human_sre",
    label: "DevOps Engineer (David)",
    category: "human",
    url: makeHumanAvatar("#7c3aed", "DK", "David"),
  },
  {
    id: "human_security",
    label: "Security Lead (Maya)",
    category: "human",
    url: makeHumanAvatar("#dc2626", "ML", "Maya"),
  },
];

export const DEFAULT_AVATAR = AVATAR_PRESETS[0].url;
