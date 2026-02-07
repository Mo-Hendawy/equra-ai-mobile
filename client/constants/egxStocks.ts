export interface EGXStock {
  symbol: string;
  nameEn: string;
  nameAr: string;
  sector: string;
}

export const EGX_STOCKS: EGXStock[] = [
  // Banks
  { symbol: "COMI", nameEn: "Commercial International Bank", nameAr: "البنك التجاري الدولي", sector: "Banks" },
  { symbol: "ADIB", nameEn: "Abu Dhabi Islamic Bank Egypt", nameAr: "مصرف أبوظبي الإسلامي مصر", sector: "Banks" },
  { symbol: "ALEX", nameEn: "Bank of Alexandria", nameAr: "بنك الإسكندرية", sector: "Banks" },
  { symbol: "QNBA", nameEn: "QNB Alahli", nameAr: "بنك قطر الوطني الأهلي", sector: "Banks" },
  { symbol: "SAIB", nameEn: "Societe Arabe Internationale de Banque", nameAr: "المصرف العربي الدولي", sector: "Banks" },
  { symbol: "EGBE", nameEn: "Egyptian Gulf Bank", nameAr: "البنك المصري الخليجي", sector: "Banks" },
  { symbol: "CREA", nameEn: "Credit Agricole Egypt", nameAr: "كريدي أجريكول مصر", sector: "Banks" },
  { symbol: "FAIT", nameEn: "Faisal Islamic Bank of Egypt", nameAr: "بنك فيصل الإسلامي المصري", sector: "Banks" },
  { symbol: "HDBK", nameEn: "Housing & Development Bank", nameAr: "بنك التعمير والإسكان", sector: "Banks" },
  { symbol: "NBKE", nameEn: "National Bank of Kuwait - Egypt", nameAr: "بنك الكويت الوطني مصر", sector: "Banks" },
  { symbol: "EXPA", nameEn: "Export Development Bank of Egypt", nameAr: "البنك المصري لتنمية الصادرات", sector: "Banks" },
  
  // Financial Services
  { symbol: "HRHO", nameEn: "EFG Hermes Holding", nameAr: "المجموعة المالية هيرميس القابضة", sector: "Financial Services" },
  { symbol: "EFIH", nameEn: "EFI Finance", nameAr: "اي اف جي للتمويل", sector: "Financial Services" },
  { symbol: "CIEB", nameEn: "Credit Agricole Egypt", nameAr: "كريدي أجريكول مصر", sector: "Financial Services" },
  { symbol: "VALU", nameEn: "U Consumer Finance", nameAr: "فاليو", sector: "Financial Services" },
  { symbol: "AJWA", nameEn: "Ajwa For Food Industries Company Egypt", nameAr: "اجوا للصناعات الغذائية", sector: "Consumer Goods" },
  { symbol: "EFIC", nameEn: "Egyptian Financial & Industrial", nameAr: "المصرية المالية والصناعية", sector: "Financial Services" },
  { symbol: "MENA", nameEn: "Beltone Financial Holding", nameAr: "بلتون المالية القابضة", sector: "Financial Services" },
  { symbol: "PRMH", nameEn: "Prime Holding", nameAr: "برايم القابضة", sector: "Financial Services" },
  { symbol: "BTFH", nameEn: "Beltone Financial Holding", nameAr: "بلتون المالية القابضة", sector: "Financial Services" },
  
  // Real Estate
  { symbol: "TMGH", nameEn: "Talaat Moustafa Group Holding", nameAr: "مجموعة طلعت مصطفى القابضة", sector: "Real Estate" },
  { symbol: "EMFD", nameEn: "Emaar Misr for Development", nameAr: "إعمار مصر للتنمية", sector: "Real Estate" },
  { symbol: "MNHD", nameEn: "Medinet Nasr Housing", nameAr: "مدينة نصر للإسكان والتعمير", sector: "Real Estate" },
  { symbol: "SODIC", nameEn: "SODIC", nameAr: "سوديك", sector: "Real Estate" },
  { symbol: "PHDC", nameEn: "Palm Hills Developments", nameAr: "بالم هيلز للتعمير", sector: "Real Estate" },
  { symbol: "OCDI", nameEn: "Six Of October Development & Investment (Sodic)", nameAr: "سوديك", sector: "Real Estate" },
  { symbol: "ODHN", nameEn: "Orascom Development Holding AG", nameAr: "أوراسكوم للتنمية", sector: "Real Estate" },
  { symbol: "HELI", nameEn: "Heliopolis Company for Housing", nameAr: "مصر الجديدة للإسكان والتعمير", sector: "Real Estate" },
  { symbol: "NASR", nameEn: "Nasr City Housing & Development", nameAr: "النصر للإسكان والتعمير", sector: "Real Estate" },
  { symbol: "ELKA", nameEn: "El Kahera Housing & Development", nameAr: "القاهرة للإسكان والتعمير", sector: "Real Estate" },
  { symbol: "AMER", nameEn: "Amer Group Holding", nameAr: "عامر جروب", sector: "Real Estate" },
  { symbol: "AREH", nameEn: "Arab Real Estate Holdings", nameAr: "العرب للعقارات القابضة", sector: "Real Estate" },
  { symbol: "PRDC", nameEn: "Porto Group Holding", nameAr: "بورتو جروب القابضة", sector: "Real Estate" },
  { symbol: "MASR", nameEn: "Misr Real Estate Assets", nameAr: "مصر للأصول العقارية", sector: "Real Estate" },
  
  // Industrial
  { symbol: "SWDY", nameEn: "El Sewedy Electric", nameAr: "السويدي إليكتريك", sector: "Industrial" },
  { symbol: "ORWE", nameEn: "Oriental Weavers Carpet", nameAr: "السجاد الشرقي", sector: "Consumer Goods" },
  { symbol: "ORAS", nameEn: "Orascom Construction Industries", nameAr: "أوراسكوم للإنشاء والصناعة", sector: "Industrial" },
  { symbol: "ALCN", nameEn: "Alexandria Containers & Goods", nameAr: "الإسكندرية للحاويات والبضائع", sector: "Industrial" },
  { symbol: "DCRC", nameEn: "Delta Construction & Rebuilding", nameAr: "دلتا للإنشاء والتعمير", sector: "Financial Services" },
  { symbol: "EGCH", nameEn: "Egyptian Chemical Industries (Kima)", nameAr: "الكيماويات المصرية كيما", sector: "Basic Materials" },
  { symbol: "GMCI", nameEn: "GMC Group For Industrial, Commercial And Financial Investments", nameAr: "جي إم سي", sector: "Financial Services" },
  { symbol: "PACH", nameEn: "Paints & Chemicals Industries", nameAr: "الدهانات والصناعات الكيماوية", sector: "Industrial" },
  
  // Consumer Goods
  { symbol: "EAST", nameEn: "Eastern Company", nameAr: "الشرقية للدخان", sector: "Consumer Goods" },
  { symbol: "JUFO", nameEn: "Juhayna Food Industries", nameAr: "جهينة للصناعات الغذائية", sector: "Consumer Goods" },
  { symbol: "AUTO", nameEn: "GB Auto", nameAr: "جي بي أوتو", sector: "Consumer Goods" },
  { symbol: "SUGR", nameEn: "Delta Sugar", nameAr: "دلتا للسكر", sector: "Consumer Goods" },
  { symbol: "USGC", nameEn: "United Sugar Company of Egypt", nameAr: "السكر المتحدة المصرية", sector: "Consumer Goods" },
  { symbol: "POUL", nameEn: "Cairo Poultry", nameAr: "القاهرة للدواجن", sector: "Consumer Goods" },
  { symbol: "ELEC", nameEn: "Electro Cable Egypt Company", nameAr: "إلكترو كابل مصر", sector: "Industrial" },
  { symbol: "ICMI", nameEn: "International Company for Medical Industries", nameAr: "الدولية للصناعات الطبية", sector: "Consumer Goods" },
  { symbol: "ESRC", nameEn: "Egyptian Starch & Glucose", nameAr: "النشا والجلوكوز المصرية", sector: "Consumer Goods" },
  { symbol: "DSCW", nameEn: "Dice Sport & Casual Wear", nameAr: "دايس للملابس الرياضية", sector: "Consumer Goods" },
  { symbol: "EFID", nameEn: "Edita Food Industries", nameAr: "إيديتا للصناعات الغذائية", sector: "Consumer Goods" },
  { symbol: "DOMT", nameEn: "Arabian Food Industries Company (DOMTY)", nameAr: "دومتي للصناعات الغذائية", sector: "Consumer Goods" },
  { symbol: "OBEY", nameEn: "Obour Land for Food Industries", nameAr: "أراضي العبور للصناعات الغذائية", sector: "Consumer Goods" },
  
  // Basic Materials
  { symbol: "ABUK", nameEn: "Abu Qir Fertilizers & Chemical", nameAr: "أبو قير للأسمدة والصناعات الكيماوية", sector: "Basic Materials" },
  { symbol: "SKPC", nameEn: "Sidi Kerir Petrochemicals", nameAr: "سيدي كرير للبتروكيماويات", sector: "Basic Materials" },
  { symbol: "ESRS", nameEn: "Ezz Steel", nameAr: "حديد عز", sector: "Basic Materials" },
  { symbol: "ARCC", nameEn: "Arabian Cement Company", nameAr: "الأسمنت العربية", sector: "Industrial" },
  { symbol: "CCAP", nameEn: "Carbon Holdings", nameAr: "كاربون القابضة", sector: "Basic Materials" },
  { symbol: "MFPC", nameEn: "Misr Fertilizers Production Company", nameAr: "موبكو", sector: "Basic Materials" },
  { symbol: "EGSA", nameEn: "Egyptian Satellites (NileSat)", nameAr: "نايل سات", sector: "Telecommunications" },
  { symbol: "IRON", nameEn: "Egyptian Iron & Steel", nameAr: "الحديد والصلب المصرية", sector: "Basic Materials" },
  { symbol: "EGAL", nameEn: "Egypt Aluminum", nameAr: "مصر للألومنيوم", sector: "Basic Materials" },
  { symbol: "NSGD", nameEn: "National Steel Industrial", nameAr: "الحديد والصلب للمباني", sector: "Basic Materials" },
  { symbol: "MICH", nameEn: "Misr Chemical Industries", nameAr: "مصر للصناعات الكيماوية", sector: "Basic Materials" },
  { symbol: "ISPH", nameEn: "Ispat Steel Industries", nameAr: "إسبات للصناعات الحديدية", sector: "Basic Materials" },
  { symbol: "TORA", nameEn: "Tourah Cement", nameAr: "اسمنت طره", sector: "Industrial" },
  { symbol: "SUCE", nameEn: "Suez Cement", nameAr: "أسمنت السويس", sector: "Industrial" },
  { symbol: "SCEM", nameEn: "Sinai Cement", nameAr: "أسمنت سيناء", sector: "Industrial" },
  
  // Healthcare
  { symbol: "CLHO", nameEn: "Cleopatra Hospital", nameAr: "مستشفى كليوباترا", sector: "Healthcare" },
  { symbol: "PHAR", nameEn: "Egyptian International Pharmaceuticals Industries", nameAr: "ايبيكو", sector: "Healthcare" },
  { symbol: "BIOC", nameEn: "Glaxo Smith Kline", nameAr: "جلاكسو سميث كلاين", sector: "Healthcare" },
  { symbol: "AXPH", nameEn: "Alexandria Co for Pharmaceutical and Chemical Industries", nameAr: "الإسكندرية للأدوية", sector: "Healthcare" },
  { symbol: "EIPICO", nameEn: "Egyptian Int. Pharmaceutical Industries", nameAr: "ايبيكو", sector: "Healthcare" },
  { symbol: "AMPH", nameEn: "Amriya Pharmaceutical Industries", nameAr: "العامرية للصناعات الدوائية", sector: "Healthcare" },
  { symbol: "MPCI", nameEn: "Memphis Pharmaceuticals", nameAr: "ممفيس للأدوية", sector: "Healthcare" },
  { symbol: "IBMC", nameEn: "Integrated Diagnostics Holdings", nameAr: "المتكاملة للتشخيص", sector: "Healthcare" },
  { symbol: "MCQE", nameEn: "Misr Cement (Qena)", nameAr: "أسمنت مصر قنا", sector: "Industrial" },
  
  // Technology
  { symbol: "FWRY", nameEn: "Fawry for Banking Technology", nameAr: "فوري لتكنولوجيا البنوك والمدفوعات", sector: "Technology" },
  { symbol: "RAYA", nameEn: "Raya Holding for Financial Investments", nameAr: "راية القابضة للإستثمارات المالية", sector: "Technology" },
  { symbol: "EDATA", nameEn: "E-Data", nameAr: "إي داتا", sector: "Technology" },
  { symbol: "LINK", nameEn: "Link Development", nameAr: "لينك للتطوير", sector: "Technology" },
  
  // Telecommunications
  { symbol: "ETEL", nameEn: "Telecom Egypt", nameAr: "المصرية للإتصالات", sector: "Telecommunications" },
  { symbol: "GTHE", nameEn: "Global Telecom Holding", nameAr: "جلوبال تليكوم القابضة", sector: "Telecommunications" },
  
  // Energy
  { symbol: "AMOC", nameEn: "Alexandria Mineral Oils", nameAr: "أموك", sector: "Energy" },
  { symbol: "MOIL", nameEn: "Maridive & Oil Services", nameAr: "ماريدايف والخدمات البترولية", sector: "Oil & Gas" },
  { symbol: "PTRO", nameEn: "Alexandria National Refining & Petrochemicals", nameAr: "انربك", sector: "Basic Materials" },
  { symbol: "EGPC", nameEn: "Egyptian Refining Company", nameAr: "المصرية للتكرير", sector: "Energy" },
  
  // Consumer Services
  { symbol: "SPIN", nameEn: "Alexandria Spinning & Weaving (Spinalex)", nameAr: "الإسكندرية للغزل والنسيج", sector: "Consumer Goods" },
  { symbol: "EGTS", nameEn: "Egyptian Tourism Resorts", nameAr: "المصرية للمنتجعات السياحية", sector: "Consumer Services" },
  { symbol: "AIRF", nameEn: "Air Arabia Egypt", nameAr: "العربية للطيران مصر", sector: "Consumer Services" },
  { symbol: "SPHT", nameEn: "El Shams Pyramids For Hotels & Touristic Projects", nameAr: "الشمس الأهرام للفنادق", sector: "Consumer Services" },
  { symbol: "ORHD", nameEn: "Orascom Hotels And Development", nameAr: "أوراسكوم للفنادق والتطوير", sector: "Consumer Services" },
  { symbol: "SMFR", nameEn: "Samad Misr EGYFERT", nameAr: "سماد مصر", sector: "Basic Materials" },
  
  // Diversified
  { symbol: "OREG", nameEn: "Orange Egypt for Telecommunications", nameAr: "أورانج مصر للاتصالات", sector: "Telecommunications" },
  { symbol: "EGCU", nameEn: "Egypt Kuwait Holding", nameAr: "مصر الكويت القابضة", sector: "Diversified" },
  { symbol: "EGCH", nameEn: "Egyptian Chemical Industries (Kima)", nameAr: "الكيماويات المصرية كيما", sector: "Basic Materials" },
  { symbol: "EKHO", nameEn: "El Kahera Housing", nameAr: "القاهرة للإسكان", sector: "Diversified" },
  
  // Education
  { symbol: "CIRA", nameEn: "Cairo for Investment & Real Estate Development", nameAr: "القاهرة للاستثمار والتنمية العقارية", sector: "Education" },
  { symbol: "THWN", nameEn: "Taaleem Management Services", nameAr: "تعليم للخدمات الإدارية", sector: "Education" },
  
  // Additional Popular Stocks
  { symbol: "ESBE", nameEn: "El Sewedy Electric Cables", nameAr: "السويدي للكابلات", sector: "Industrial" },
  { symbol: "SPMD", nameEn: "Speed Medical", nameAr: "سبيد الطبية", sector: "Healthcare" },
  { symbol: "MNRF", nameEn: "Middle & North Africa Financial Investments", nameAr: "الشرق الأوسط وشمال أفريقيا", sector: "Financial Services" },
  { symbol: "ATQA", nameEn: "Ataka for Trade & Development", nameAr: "عتاقة للتجارة والتنمية", sector: "Consumer Services" },
  { symbol: "EXRS", nameEn: "Ezz Rebars", nameAr: "حديد التسليح عز", sector: "Basic Materials" },
  { symbol: "HAMD", nameEn: "Hamdi for Hotels", nameAr: "حمدي للفنادق", sector: "Consumer Services" },
  { symbol: "SAUD", nameEn: "Saudi Egyptian Investment & Finance", nameAr: "السعودية المصرية للاستثمار", sector: "Financial Services" },
  { symbol: "EGTV", nameEn: "Egypt Travel", nameAr: "مصر للسفريات", sector: "Consumer Services" },
  { symbol: "ELHM", nameEn: "El Hammam Group", nameAr: "مجموعة الحمام", sector: "Industrial" },
  { symbol: "ASCM", nameEn: "Asec Cement Holding", nameAr: "أسيك للأسمنت القابضة", sector: "Basic Materials" },
  { symbol: "BINV", nameEn: "Belton Investments", nameAr: "بلتون للاستثمارات", sector: "Financial Services" },
  { symbol: "RACU", nameEn: "Ra Pharmaceuticals", nameAr: "را للأدوية", sector: "Healthcare" },
].sort((a, b) => a.symbol.localeCompare(b.symbol));

export const SECTORS = [
  "Banks",
  "Financial Services",
  "Real Estate",
  "Industrial",
  "Consumer Goods",
  "Basic Materials",
  "Healthcare",
  "Technology",
  "Telecommunications",
  "Energy",
  "Consumer Services",
  "Diversified",
  "Education",
];

export const STOCK_ROLES = [
  { id: "core", label: "Core", color: "#1B5E20" },
  { id: "income", label: "Income", color: "#1565C0" },
  { id: "growth", label: "Growth", color: "#7B1FA2" },
  { id: "swing", label: "Swing", color: "#F57C00" },
  { id: "speculative", label: "Speculative", color: "#C62828" },
] as const;

export const STOCK_STATUSES = [
  { id: "hold", label: "Hold", color: "#2E7D32" },
  { id: "add_on_dips", label: "Add on Dips", color: "#1565C0" },
  { id: "reduce", label: "Reduce", color: "#F57C00" },
  { id: "exit", label: "Exit", color: "#C62828" },
  { id: "review", label: "Review", color: "#7B1FA2" },
  { id: "watch", label: "Watch", color: "#757575" },
] as const;

export type StockRole = typeof STOCK_ROLES[number]["id"];
export type StockStatus = typeof STOCK_STATUSES[number]["id"];
