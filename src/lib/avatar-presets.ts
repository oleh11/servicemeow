export interface AvatarPreset {
  id: string;
  label: string;
  category: "cat" | "human";
  url: string;
}

export const AVATAR_PRESETS: AvatarPreset[] = [
  // Cat Mascots
  {
    id: "cat_tabby",
    label: "Admin Felix (Tabby)",
    category: "cat",
    url: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=256&h=256&fit=crop&crop=faces",
  },
  {
    id: "cat_ginger",
    label: "Ginger Whiskers",
    category: "cat",
    url: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=256&h=256&fit=crop&crop=faces",
  },
  {
    id: "cat_tuxedo",
    label: "Tuxedo Commander",
    category: "cat",
    url: "https://images.unsplash.com/photo-1533738363-b7f9aef128ce?w=256&h=256&fit=crop&crop=faces",
  },
  {
    id: "cat_white",
    label: "White Snowball",
    category: "cat",
    url: "https://images.unsplash.com/photo-1543852786-1cf6624b9987?w=256&h=256&fit=crop&crop=faces",
  },
  {
    id: "cat_siamese",
    label: "Siamese Specialist",
    category: "cat",
    url: "https://images.unsplash.com/photo-1513360309081-38f0762daed1?w=256&h=256&fit=crop&crop=faces",
  },
  {
    id: "cat_calico",
    label: "Calico SRE",
    category: "cat",
    url: "https://images.unsplash.com/photo-1561948955-570b270e7c36?w=256&h=256&fit=crop&crop=faces",
  },

  // Professional Humans
  {
    id: "human_governance",
    label: "Governance Chair (Marcus)",
    category: "human",
    url: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=256&h=256&fit=crop&crop=faces",
  },
  {
    id: "human_incident",
    label: "Incident Lead (Sarah)",
    category: "human",
    url: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=256&h=256&fit=crop&crop=faces",
  },
  {
    id: "human_architect",
    label: "Staff Architect (Alex)",
    category: "human",
    url: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=256&h=256&fit=crop&crop=faces",
  },
  {
    id: "human_analyst",
    label: "Support Analyst (Elena)",
    category: "human",
    url: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=256&h=256&fit=crop&crop=faces",
  },
  {
    id: "human_sre",
    label: "DevOps Engineer (David)",
    category: "human",
    url: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=256&h=256&fit=crop&crop=faces",
  },
  {
    id: "human_security",
    label: "Security Lead (Maya)",
    category: "human",
    url: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=256&h=256&fit=crop&crop=faces",
  },
];

export const DEFAULT_AVATAR = AVATAR_PRESETS[0].url;
