import AsyncStorage from "@react-native-async-storage/async-storage";

export interface PlaybookSection {
  id: string;
  title: string;
  color: string; // section accent color
  rules: string[];
}

const STORAGE_KEY = "@playbook_rules_v1";

const DEFAULT_PLAYBOOK: PlaybookSection[] = [
  {
    id: "cash",
    title: "Cash Rules",
    color: "#1B5E20",
    rules: [
      "Minimum cash: 150k",
      "Target cash: 200k–300k",
      "No buys if cash < 150k",
    ],
  },
  {
    id: "buy",
    title: "Buy Rules",
    color: "#1565C0",
    rules: [
      "Buy only on 5–10% dip → small",
      "Buy on 10–15% dip → medium",
      "Buy on 15%+ dip → aggressive",
      "Buy during panic events only",
      "Rebuy only after selling at higher price",
    ],
  },
  {
    id: "sell",
    title: "Sell / Trim Rules",
    color: "#E65100",
    rules: [
      "Trim 15–25% at +15–20%",
      "Trim more at +30%",
      "Trim aggressively at +40%+",
      "Never fully exit core positions",
    ],
  },
  {
    id: "position",
    title: "Position Size Rules",
    color: "#7B1FA2",
    rules: [
      "Max 20% per stock",
      "Weak conviction <5%",
      "No random small positions",
    ],
  },
  {
    id: "classification",
    title: "Stock Classification",
    color: "#00695C",
    rules: [
      "Core → long-term hold",
      "Cyclical → trade only",
      "Income → dividend layer",
      "No classification = no buy",
    ],
  },
  {
    id: "noaction",
    title: "No Action Rule",
    color: "#C62828",
    rules: [
      "If no edge → no trade",
      "No impulse buying",
      "No chasing",
    ],
  },
  {
    id: "monthly",
    title: "Monthly Routine",
    color: "#37474F",
    rules: [
      "Check cash level",
      "Check position sizes",
      "Trim winners",
      "Only buy if rules met",
    ],
  },
];

export async function getPlaybook(): Promise<PlaybookSection[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return DEFAULT_PLAYBOOK;
}

export async function savePlaybook(sections: PlaybookSection[]): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(sections));
}

export async function resetPlaybookToDefault(): Promise<PlaybookSection[]> {
  await AsyncStorage.removeItem(STORAGE_KEY);
  return DEFAULT_PLAYBOOK;
}
