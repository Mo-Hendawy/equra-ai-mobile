import { StockRole, StockStatus } from "@/constants/egxStocks";

export interface PortfolioHolding {
  id: string;
  symbol: string;
  nameEn: string;
  nameAr: string;
  sector: string;
  shares: number;
  averageCost: number;
  currentPrice: number;
  role: StockRole;
  status: StockStatus;
  notes?: string;
  fairValueBase?: number;
  fairValueMid?: number;
  fairValueHigh?: number;
  eps?: number;
  growthRate?: number;
  peRatio?: number;
  bookValue?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Certificate {
  id: string;
  bankName: string;
  certificateNumber: string;
  principalAmount: number;
  interestRate: number;
  startDate: string;
  maturityDate: string;
  paymentFrequency: "monthly" | "quarterly" | "semi-annual" | "annual" | "maturity";
  paymentDay: number;
  status: "active" | "matured" | "redeemed";
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
}

export interface Dividend {
  id: string;
  holdingId: string;
  symbol: string;
  amount: number;
  exDate: string;
  paymentDate: string;
  status: "announced" | "paid";
  createdAt: string;
  updatedAt: string;
}

export interface WatchlistItem {
  id: string;
  symbol: string;
  nameEn: string;
  nameAr: string;
  sector: string;
  targetPrice?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RealizedGain {
  id: string;
  symbol: string;
  shares: number;
  buyPrice: number;
  sellPrice: number;
  buyDate: string;
  sellDate: string;
  profit: number;
  createdAt: string;
}

export interface StockTransaction {
  id: string;
  holdingId: string;
  symbol: string;
  type: "buy" | "sell";
  shares: number;
  pricePerShare: number;
  fees: number;
  date: string;
  notes?: string;
  createdAt: string;
}

export interface Target {
  id: string;
  symbol: string;
  name: string;
  targetPercentage: number;
  currentPercentage: number;
  category: "sector" | "role" | "custom";
  createdAt: string;
  updatedAt: string;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCost: number;
  totalPL: number;
  totalPLPercent: number;
  holdingsCount: number;
}
