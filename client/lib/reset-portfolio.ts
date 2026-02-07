import AsyncStorage from "@react-native-async-storage/async-storage";
import type { PortfolioHolding } from "@/types";

// Simple UUID v4 generator
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

const NEW_PORTFOLIO_DATA = [
  { 
    symbol: "ADCI", 
    nameEn: "Arab Pharmaceuticals", 
    nameAr: "العربية للأدوية", 
    shares: 222, 
    avgCost: 160.11, 
    sector: "Healthcare", 
    role: "core" as const, 
    status: "hold" as const 
  },
  { 
    symbol: "BONY", 
    nameEn: "Bonyan for Development and Trade", 
    nameAr: "بنيان للتنمية والتجارة", 
    shares: 5592, 
    avgCost: 4.25, 
    sector: "Real Estate", 
    role: "speculative" as const, 
    status: "hold" as const 
  },
  { 
    symbol: "COMI", 
    nameEn: "Commercial International Bank", 
    nameAr: "البنك التجاري الدولي", 
    shares: 10, 
    avgCost: 125.46, 
    sector: "Banks", 
    role: "core" as const, 
    status: "hold" as const 
  },
  { 
    symbol: "EGAL", 
    nameEn: "Egypt Aluminum", 
    nameAr: "مصر للألومنيوم", 
    shares: 1254, 
    avgCost: 222.54, 
    sector: "Basic Materials", 
    role: "core" as const, 
    status: "hold" as const 
  },
  { 
    symbol: "ETEL", 
    nameEn: "Telecom Egypt", 
    nameAr: "المصرية للإتصالات", 
    shares: 1757, 
    avgCost: 78.50, 
    sector: "Telecommunications", 
    role: "income" as const, 
    status: "hold" as const 
  },
  { 
    symbol: "JUFO", 
    nameEn: "Juhayna Food Industries", 
    nameAr: "جهينة للصناعات الغذائية", 
    shares: 4513, 
    avgCost: 23.17, 
    sector: "Consumer Goods", 
    role: "core" as const, 
    status: "hold" as const 
  },
  { 
    symbol: "MFPC", 
    nameEn: "Misr Fertilizers Production Company", 
    nameAr: "موبكو", 
    shares: 4433, 
    avgCost: 29.33, 
    sector: "Basic Materials", 
    role: "income" as const, 
    status: "hold" as const 
  },
  { 
    symbol: "MICH", 
    nameEn: "Misr Chemical Industries", 
    nameAr: "مصر للصناعات الكيماوية", 
    shares: 11697, 
    avgCost: 32.52, 
    sector: "Basic Materials", 
    role: "income" as const, 
    status: "hold" as const 
  },
  { 
    symbol: "POUL", 
    nameEn: "Cairo Poultry", 
    nameAr: "القاهرة للدواجن", 
    shares: 1205, 
    avgCost: 25.14, 
    sector: "Consumer Goods", 
    role: "growth" as const, 
    status: "hold" as const 
  },
  { 
    symbol: "SWDY", 
    nameEn: "El Sewedy Electric", 
    nameAr: "السويدي إليكتريك", 
    shares: 1252, 
    avgCost: 77.57, 
    sector: "Industrial", 
    role: "core" as const, 
    status: "hold" as const 
  },
  { 
    symbol: "UBEE", 
    nameEn: "The United Bank", 
    nameAr: "البنك المتحد", 
    shares: 3504, 
    avgCost: 14.62, 
    sector: "Banks", 
    role: "growth" as const, 
    status: "hold" as const 
  },
  { 
    symbol: "VALU", 
    nameEn: "U Consumer Finance", 
    nameAr: "فاليو", 
    shares: 214, 
    avgCost: 8.97, 
    sector: "Financial Services", 
    role: "growth" as const, 
    status: "hold" as const 
  },
];

export async function resetPortfolio(): Promise<void> {
  console.log("🔄 Clearing existing portfolio...");
  
  // Clear only portfolio holdings (keep certificates, dividends, etc.)
  await AsyncStorage.removeItem("@egx_holdings");
  await AsyncStorage.removeItem("@egx_transactions");
  
  console.log("✅ Portfolio cleared!");
  console.log("📥 Importing new portfolio data...");
  
  const newHoldings: PortfolioHolding[] = NEW_PORTFOLIO_DATA.map((stock) => ({
    id: uuidv4(),
    symbol: stock.symbol,
    nameEn: stock.nameEn,
    nameAr: stock.nameAr,
    shares: stock.shares,
    averageCost: stock.avgCost,
    currentPrice: 0,
    sector: stock.sector,
    role: stock.role,
    status: stock.status,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }));
  
  await AsyncStorage.setItem("@egx_holdings", JSON.stringify(newHoldings));
  
  console.log(`✅ Imported ${newHoldings.length} stocks successfully!`);
  console.log("📊 New Portfolio:");
  newHoldings.forEach((h) => {
    console.log(`  - ${h.symbol}: ${h.shares} shares @ EGP ${h.averageCost}`);
  });
}
