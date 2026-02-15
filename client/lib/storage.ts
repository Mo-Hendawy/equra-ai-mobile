import AsyncStorage from "@react-native-async-storage/async-storage";

// Simple UUID v4 generator (doesn't require crypto)
function uuidv4(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
import type {
  PortfolioHolding,
  Certificate,
  Expense,
  ExpenseCategory,
  Dividend,
  WatchlistItem,
  RealizedGain,
  Target,
  StockTransaction,
} from "@/types";

const STORAGE_KEYS = {
  HOLDINGS: "@egx_holdings",
  CERTIFICATES: "@egx_certificates",
  EXPENSES: "@egx_expenses",
  EXPENSE_CATEGORIES: "@egx_expense_categories",
  DIVIDENDS: "@egx_dividends",
  WATCHLIST: "@egx_watchlist",
  REALIZED_GAINS: "@egx_realized_gains",
  TARGETS: "@egx_targets",
  TRANSACTIONS: "@egx_transactions",
};

const DEFAULT_EXPENSE_CATEGORIES: ExpenseCategory[] = [
  { id: "1", name: "Brokerage Fees", color: "#1B5E20" },
  { id: "2", name: "Transfer Fees", color: "#1565C0" },
  { id: "3", name: "Subscription Fees", color: "#7B1FA2" },
  { id: "4", name: "Research Tools", color: "#F57C00" },
  { id: "5", name: "Other", color: "#757575" },
];

const INITIAL_HOLDINGS_SEED = [
  { symbol: "ABUK", nameEn: "Abou Kir Fertilizers", nameAr: "أبو قير للأسمدة", shares: 335, avgCost: 50.79, sector: "Basic Resources", role: "income" as const, status: "hold" as const },
  { symbol: "BONY", nameEn: "Bonyyan Development & Trade", nameAr: "بنيان للتنمية والتجارة", shares: 5592, avgCost: 4.25, sector: "Real Estate", role: "speculative" as const, status: "hold" as const },
  { symbol: "EGAL", nameEn: "Egypt Aluminum", nameAr: "مصر للألومنيوم", shares: 1004, avgCost: 27.80, sector: "Basic Resources", role: "core" as const, status: "hold" as const },
  { symbol: "ETEL", nameEn: "Telecom Egypt", nameAr: "المصرية للاتصالات", shares: 252, avgCost: 67.38, sector: "Telecommunications", role: "income" as const, status: "hold" as const },
  { symbol: "GBCO", nameEn: "GB Auto", nameAr: "جي بي أوتو", shares: 1803, avgCost: 26.82, sector: "Automobiles", role: "growth" as const, status: "hold" as const },
  { symbol: "ISPH", nameEn: "Ibnsina Pharma", nameAr: "ابن سينا فارما", shares: 1360, avgCost: 10.47, sector: "Healthcare", role: "growth" as const, status: "hold" as const },
  { symbol: "JUFO", nameEn: "Juhayna Food Industries", nameAr: "جهينة للصناعات الغذائية", shares: 4533, avgCost: 23.17, sector: "Food & Beverage", role: "core" as const, status: "hold" as const },
  { symbol: "MFPC", nameEn: "Misr Fertilizers Production - MOPCO", nameAr: "موبكو للأسمدة", shares: 4433, avgCost: 29.33, sector: "Basic Resources", role: "income" as const, status: "hold" as const },
  { symbol: "MICH", nameEn: "Misr Chemical Industries", nameAr: "مصر للصناعات الكيماوية", shares: 11697, avgCost: 32.52, sector: "Chemicals", role: "income" as const, status: "hold" as const },
  { symbol: "POUL", nameEn: "Cairo Poultry Company", nameAr: "القاهرة للدواجن", shares: 4205, avgCost: 25.14, sector: "Food & Beverage", role: "growth" as const, status: "hold" as const },
  { symbol: "RMDA", nameEn: "Tenth of Ramadan for Pharmaceutical - Rameda", nameAr: "راميدا للأدوية", shares: 8452, avgCost: 3.24, sector: "Healthcare", role: "growth" as const, status: "hold" as const },
  { symbol: "SWDY", nameEn: "El Sewedy Electric", nameAr: "السويدي إليكتريك", shares: 1857, avgCost: 77.47, sector: "Industrial Goods", role: "core" as const, status: "hold" as const },
  { symbol: "VALU", nameEn: "Valu - EFG Finance", nameAr: "ڤاليو", shares: 5216, avgCost: 8.97, sector: "Financial Services", role: "growth" as const, status: "hold" as const },
];

async function getItems<T>(key: string): Promise<T[]> {
  try {
    const data = await AsyncStorage.getItem(key);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error(`Error reading ${key}:`, error);
    return [];
  }
}

async function setItems<T>(key: string, items: T[]): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(items));
  } catch (error) {
    console.error(`Error writing ${key}:`, error);
    throw error;
  }
}

export const holdingsStorage = {
  getAll: () => getItems<PortfolioHolding>(STORAGE_KEYS.HOLDINGS),
  
  add: async (holding: Omit<PortfolioHolding, "id" | "createdAt" | "updatedAt">) => {
    const holdings = await holdingsStorage.getAll();
    const newHolding: PortfolioHolding = {
      ...holding,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    holdings.push(newHolding);
    await setItems(STORAGE_KEYS.HOLDINGS, holdings);
    return newHolding;
  },
  
  seedInitialHoldings: async () => {
    // DISABLED: Portfolio is now managed by reset-portfolio.ts
    // This function used to seed old demo data which was interfering with the user's portfolio
    return 0;
  },
  
  update: async (id: string, updates: Partial<PortfolioHolding>) => {
    const holdings = await holdingsStorage.getAll();
    const index = holdings.findIndex((h) => h.id === id);
    if (index === -1) throw new Error("Holding not found");
    holdings[index] = {
      ...holdings[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await setItems(STORAGE_KEYS.HOLDINGS, holdings);
    return holdings[index];
  },
  
  delete: async (id: string) => {
    const holdings = await holdingsStorage.getAll();
    const filtered = holdings.filter((h) => h.id !== id);
    await setItems(STORAGE_KEYS.HOLDINGS, filtered);
  },
  
  getById: async (id: string) => {
    const holdings = await holdingsStorage.getAll();
    return holdings.find((h) => h.id === id);
  },
};

const HSBC_CERTIFICATES_SEED = [
  { num: "235", principal: 300000, rate: 22.0, start: "2024-07-17" },
  { num: "236", principal: 70000, rate: 22.0, start: "2024-07-24" },
  { num: "237", principal: 70000, rate: 22.0, start: "2024-08-04" },
  { num: "238", principal: 70000, rate: 22.0, start: "2024-08-29" },
  { num: "239", principal: 80000, rate: 22.0, start: "2024-09-03" },
  { num: "900", principal: 70000, rate: 22.0, start: "2024-09-26" },
  { num: "901", principal: 80000, rate: 22.0, start: "2024-10-07" },
  { num: "902", principal: 70000, rate: 20.5, start: "2024-10-30" },
  { num: "903", principal: 80000, rate: 20.5, start: "2024-11-05" },
  { num: "904", principal: 70000, rate: 20.5, start: "2024-12-05" },
  { num: "905", principal: 120000, rate: 20.5, start: "2024-12-16" },
  { num: "906", principal: 70000, rate: 20.5, start: "2024-12-26" },
  { num: "907", principal: 100000, rate: 20.5, start: "2025-01-08" },
  { num: "908", principal: 70000, rate: 20.5, start: "2025-01-27" },
  { num: "909", principal: 100000, rate: 20.5, start: "2025-02-05" },
  { num: "910", principal: 60000, rate: 20.5, start: "2025-02-27" },
  { num: "911", principal: 450000, rate: 20.5, start: "2025-03-09" },
  { num: "912", principal: 120000, rate: 20.5, start: "2025-03-27" },
  { num: "913", principal: 210000, rate: 20.5, start: "2025-07-06" },
  { num: "914", principal: 80000, rate: 20.5, start: "2025-09-15" },
];

export const certificatesStorage = {
  getAll: () => getItems<Certificate>(STORAGE_KEYS.CERTIFICATES),
  
  add: async (cert: Omit<Certificate, "id" | "createdAt" | "updatedAt">) => {
    const certs = await certificatesStorage.getAll();
    const newCert: Certificate = {
      ...cert,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    certs.push(newCert);
    await setItems(STORAGE_KEYS.CERTIFICATES, certs);
    return newCert;
  },
  
  seedHSBCCertificates: async () => {
    const existing = await certificatesStorage.getAll();
    const existingNums = existing.map(c => c.certificateNumber);
    
    const newCerts: Certificate[] = [];
    
    for (const seed of HSBC_CERTIFICATES_SEED) {
      if (existingNums.includes(seed.num)) continue;
      
      const startDate = new Date(seed.start);
      const maturityDate = new Date(startDate);
      maturityDate.setFullYear(maturityDate.getFullYear() + 3);
      
      newCerts.push({
        id: uuidv4(),
        bankName: "HSBC",
        certificateNumber: seed.num,
        principalAmount: seed.principal,
        interestRate: seed.rate,
        startDate: seed.start,
        maturityDate: maturityDate.toISOString().split("T")[0],
        paymentDay: startDate.getDate(),
        paymentFrequency: "monthly",
        status: "active",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    
    if (newCerts.length > 0) {
      await setItems(STORAGE_KEYS.CERTIFICATES, [...existing, ...newCerts]);
    }
    
    return newCerts.length;
  },
  
  update: async (id: string, updates: Partial<Certificate>) => {
    const certs = await certificatesStorage.getAll();
    const index = certs.findIndex((c) => c.id === id);
    if (index === -1) throw new Error("Certificate not found");
    certs[index] = {
      ...certs[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await setItems(STORAGE_KEYS.CERTIFICATES, certs);
    return certs[index];
  },
  
  delete: async (id: string) => {
    const certs = await certificatesStorage.getAll();
    const filtered = certs.filter((c) => c.id !== id);
    await setItems(STORAGE_KEYS.CERTIFICATES, filtered);
  },
};

export const expensesStorage = {
  getAll: () => getItems<Expense>(STORAGE_KEYS.EXPENSES),
  
  add: async (expense: Omit<Expense, "id" | "createdAt" | "updatedAt">) => {
    const expenses = await expensesStorage.getAll();
    const newExpense: Expense = {
      ...expense,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    expenses.push(newExpense);
    await setItems(STORAGE_KEYS.EXPENSES, expenses);
    return newExpense;
  },
  
  delete: async (id: string) => {
    const expenses = await expensesStorage.getAll();
    const filtered = expenses.filter((e) => e.id !== id);
    await setItems(STORAGE_KEYS.EXPENSES, filtered);
  },
};

export const expenseCategoriesStorage = {
  getAll: async (): Promise<ExpenseCategory[]> => {
    const categories = await getItems<ExpenseCategory>(STORAGE_KEYS.EXPENSE_CATEGORIES);
    if (categories.length === 0) {
      await setItems(STORAGE_KEYS.EXPENSE_CATEGORIES, DEFAULT_EXPENSE_CATEGORIES);
      return DEFAULT_EXPENSE_CATEGORIES;
    }
    return categories;
  },
  
  add: async (category: Omit<ExpenseCategory, "id">) => {
    const categories = await expenseCategoriesStorage.getAll();
    const newCategory: ExpenseCategory = {
      ...category,
      id: uuidv4(),
    };
    categories.push(newCategory);
    await setItems(STORAGE_KEYS.EXPENSE_CATEGORIES, categories);
    return newCategory;
  },
  
  delete: async (id: string) => {
    const categories = await expenseCategoriesStorage.getAll();
    const filtered = categories.filter((c) => c.id !== id);
    await setItems(STORAGE_KEYS.EXPENSE_CATEGORIES, filtered);
  },
};

export const dividendsStorage = {
  getAll: () => getItems<Dividend>(STORAGE_KEYS.DIVIDENDS),
  
  add: async (dividend: Omit<Dividend, "id" | "createdAt" | "updatedAt">) => {
    const dividends = await dividendsStorage.getAll();
    const newDividend: Dividend = {
      ...dividend,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dividends.push(newDividend);
    await setItems(STORAGE_KEYS.DIVIDENDS, dividends);
    return newDividend;
  },
  
  update: async (id: string, updates: Partial<Dividend>) => {
    const dividends = await dividendsStorage.getAll();
    const index = dividends.findIndex((d) => d.id === id);
    if (index === -1) throw new Error("Dividend not found");
    dividends[index] = {
      ...dividends[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await setItems(STORAGE_KEYS.DIVIDENDS, dividends);
    return dividends[index];
  },
  
  delete: async (id: string) => {
    const dividends = await dividendsStorage.getAll();
    const filtered = dividends.filter((d) => d.id !== id);
    await setItems(STORAGE_KEYS.DIVIDENDS, filtered);
  },
};

export const watchlistStorage = {
  getAll: () => getItems<WatchlistItem>(STORAGE_KEYS.WATCHLIST),
  
  add: async (item: Omit<WatchlistItem, "id" | "createdAt" | "updatedAt">) => {
    const items = await watchlistStorage.getAll();
    const newItem: WatchlistItem = {
      ...item,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    items.push(newItem);
    await setItems(STORAGE_KEYS.WATCHLIST, items);
    return newItem;
  },
  
  delete: async (id: string) => {
    const items = await watchlistStorage.getAll();
    const filtered = items.filter((i) => i.id !== id);
    await setItems(STORAGE_KEYS.WATCHLIST, filtered);
  },
};

export const realizedGainsStorage = {
  getAll: () => getItems<RealizedGain>(STORAGE_KEYS.REALIZED_GAINS),
  
  add: async (gain: Omit<RealizedGain, "id" | "createdAt">) => {
    const gains = await realizedGainsStorage.getAll();
    const newGain: RealizedGain = {
      ...gain,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    gains.push(newGain);
    await setItems(STORAGE_KEYS.REALIZED_GAINS, gains);
    return newGain;
  },
  
  delete: async (id: string) => {
    const gains = await realizedGainsStorage.getAll();
    const filtered = gains.filter((g) => g.id !== id);
    await setItems(STORAGE_KEYS.REALIZED_GAINS, filtered);
  },
};

export const targetsStorage = {
  getAll: () => getItems<Target>(STORAGE_KEYS.TARGETS),
  
  add: async (target: Omit<Target, "id" | "createdAt" | "updatedAt">) => {
    const targets = await targetsStorage.getAll();
    const newTarget: Target = {
      ...target,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    targets.push(newTarget);
    await setItems(STORAGE_KEYS.TARGETS, targets);
    return newTarget;
  },
  
  update: async (id: string, updates: Partial<Target>) => {
    const targets = await targetsStorage.getAll();
    const index = targets.findIndex((t) => t.id === id);
    if (index === -1) throw new Error("Target not found");
    targets[index] = {
      ...targets[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    await setItems(STORAGE_KEYS.TARGETS, targets);
    return targets[index];
  },
  
  delete: async (id: string) => {
    const targets = await targetsStorage.getAll();
    const filtered = targets.filter((t) => t.id !== id);
    await setItems(STORAGE_KEYS.TARGETS, filtered);
  },
};

export const transactionsStorage = {
  getAll: () => getItems<StockTransaction>(STORAGE_KEYS.TRANSACTIONS),
  
  getByHolding: async (holdingId: string) => {
    const transactions = await transactionsStorage.getAll();
    return transactions.filter(t => t.holdingId === holdingId);
  },
  
  getBySymbol: async (symbol: string) => {
    const transactions = await transactionsStorage.getAll();
    return transactions.filter(t => t.symbol === symbol);
  },
  
  add: async (transaction: Omit<StockTransaction, "id" | "createdAt">) => {
    const transactions = await transactionsStorage.getAll();
    const newTransaction: StockTransaction = {
      ...transaction,
      id: uuidv4(),
      createdAt: new Date().toISOString(),
    };
    transactions.push(newTransaction);
    await setItems(STORAGE_KEYS.TRANSACTIONS, transactions);
    return newTransaction;
  },
  
  update: async (id: string, updates: Partial<Omit<StockTransaction, "id" | "createdAt">>) => {
    const transactions = await transactionsStorage.getAll();
    const index = transactions.findIndex(t => t.id === id);
    if (index === -1) throw new Error("Transaction not found");
    transactions[index] = { ...transactions[index], ...updates };
    await setItems(STORAGE_KEYS.TRANSACTIONS, transactions);
    return transactions[index];
  },

  delete: async (id: string) => {
    const transactions = await transactionsStorage.getAll();
    const filtered = transactions.filter(t => t.id !== id);
    await setItems(STORAGE_KEYS.TRANSACTIONS, filtered);
  },
  
  buyStock: async (params: {
    holdingId: string;
    symbol: string;
    shares: number;
    pricePerShare: number;
    fees: number;
    date: string;
    notes?: string;
  }) => {
    const transaction = await transactionsStorage.add({
      ...params,
      type: "buy",
    });
    
    const holding = await holdingsStorage.getById(params.holdingId);
    if (holding) {
      const totalOldCost = holding.shares * holding.averageCost;
      const newCost = params.shares * params.pricePerShare + params.fees;
      const newShares = holding.shares + params.shares;
      const newAvgCost = (totalOldCost + newCost) / newShares;
      
      await holdingsStorage.update(params.holdingId, {
        shares: newShares,
        averageCost: newAvgCost,
      });
    }
    
    return transaction;
  },
  
  sellStock: async (params: {
    holdingId: string;
    symbol: string;
    shares: number;
    pricePerShare: number;
    fees: number;
    date: string;
    notes?: string;
  }) => {
    const holding = await holdingsStorage.getById(params.holdingId);
    if (!holding) throw new Error("Holding not found");
    if (params.shares > holding.shares) throw new Error("Cannot sell more shares than owned");
    
    const transaction = await transactionsStorage.add({
      ...params,
      type: "sell",
    });
    
    const profit = (params.pricePerShare - holding.averageCost) * params.shares - params.fees;
    
    await realizedGainsStorage.add({
      symbol: params.symbol,
      shares: params.shares,
      buyPrice: holding.averageCost,
      sellPrice: params.pricePerShare,
      buyDate: holding.createdAt.split("T")[0],
      sellDate: params.date,
      profit,
    });
    
    const newShares = holding.shares - params.shares;
    
    if (newShares === 0) {
      await holdingsStorage.delete(params.holdingId);
    } else {
      await holdingsStorage.update(params.holdingId, {
        shares: newShares,
      });
    }
    
    return { transaction, profit };
  },
};

export const backupStorage = {
  export: async (): Promise<string> => {
    const data = {
      holdings: await holdingsStorage.getAll(),
      certificates: await certificatesStorage.getAll(),
      expenses: await expensesStorage.getAll(),
      expenseCategories: await expenseCategoriesStorage.getAll(),
      dividends: await dividendsStorage.getAll(),
      watchlist: await watchlistStorage.getAll(),
      realizedGains: await realizedGainsStorage.getAll(),
      targets: await targetsStorage.getAll(),
      transactions: await transactionsStorage.getAll(),
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  },
  
  import: async (jsonString: string): Promise<void> => {
    try {
      const data = JSON.parse(jsonString);
      if (data.holdings) await setItems(STORAGE_KEYS.HOLDINGS, data.holdings);
      if (data.certificates) await setItems(STORAGE_KEYS.CERTIFICATES, data.certificates);
      if (data.expenses) await setItems(STORAGE_KEYS.EXPENSES, data.expenses);
      if (data.expenseCategories) await setItems(STORAGE_KEYS.EXPENSE_CATEGORIES, data.expenseCategories);
      if (data.dividends) await setItems(STORAGE_KEYS.DIVIDENDS, data.dividends);
      if (data.watchlist) await setItems(STORAGE_KEYS.WATCHLIST, data.watchlist);
      if (data.realizedGains) await setItems(STORAGE_KEYS.REALIZED_GAINS, data.realizedGains);
      if (data.targets) await setItems(STORAGE_KEYS.TARGETS, data.targets);
      if (data.transactions) await setItems(STORAGE_KEYS.TRANSACTIONS, data.transactions);
    } catch (error) {
      throw new Error("Invalid backup file format");
    }
  },
  
  clearAll: async (): Promise<void> => {
    await Promise.all(
      Object.values(STORAGE_KEYS).map((key) => AsyncStorage.removeItem(key))
    );
  },
};
