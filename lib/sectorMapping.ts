/**
 * Static Sector Mapping for Indonesian Stocks (IDX)
 * 
 * This file contains manually curated sector classifications for stocks.
 * Source: Stockbit API + IDX sector classifications
 * 
 * Last Updated: 2026-02-28
 * Update Frequency: Monthly (or when significant changes occur)
 * 
 * To update this file:
 * 1. Use Stockbit API to fetch latest sector info: GET /emitten/{symbol}/info
 * 2. Cross-reference with IDX official sector classifications
 * 3. Update the mappings below
 * 4. Increment the version number
 */

export const SECTOR_VERSION = '1.0.0';
export const LAST_UPDATED = '2026-02-28';

/**
 * Main sector categories in Indonesia Stock Exchange (IDX)
 */
export enum IDXSector {
  // Primary Sectors
  BASIC_MATERIALS = 'Basic Materials',
  CONSUMER_CYCLICALS = 'Consumer Cyclicals', 
  CONSUMER_NON_CYCLICALS = 'Consumer Non-Cyclicals',
  ENERGY = 'Energy',
  FINANCIALS = 'Financials',
  HEALTHCARE = 'Healthcare',
  INDUSTRIALS = 'Industrials',
  INFRASTRUCTURE = 'Infrastructure',
  PROPERTIES_REAL_ESTATE = 'Properties & Real Estate',
  TECHNOLOGY = 'Technology',
  TRANSPORTATION_LOGISTICS = 'Transportation & Logistics',
  UNKNOWN = 'Unknown'
}

/**
 * Stock to Sector Mapping
 * Key: Stock Symbol (without .JK suffix)
 * Value: Sector name
 */
export const STOCK_SECTOR_MAP: Record<string, string> = {
  // Basic Materials - Mining & Metals
  'ANTM': IDXSector.BASIC_MATERIALS, // Aneka Tambang (Nickel, Gold)
  'INCO': IDXSector.BASIC_MATERIALS, // Vale Indonesia (Nickel)
  'TINS': IDXSector.BASIC_MATERIALS, // Timah (Tin)
  'ADRO': IDXSector.BASIC_MATERIALS, // Adaro Energy (Coal)
  'PTBA': IDXSector.BASIC_MATERIALS, // Bukit Asam (Coal)
  'ITMG': IDXSector.BASIC_MATERIALS, // Indo Tambangraya (Coal)
  'HRUM': IDXSector.BASIC_MATERIALS, // Harum Energy (Coal)
  'BRMS': IDXSector.BASIC_MATERIALS, // Bumi Resources Minerals (Coal)
  'DOID': IDXSector.BASIC_MATERIALS, // Delta Dunia (Mining Services)
  
  // Basic Materials - Cement
  'SMGR': IDXSector.BASIC_MATERIALS, // Semen Indonesia
  'INTP': IDXSector.BASIC_MATERIALS, // Indocement
  'SMCB': IDXSector.BASIC_MATERIALS, // Holcim Indonesia
  
  // Basic Materials - Chemicals & Plastics
  'TPIA': IDXSector.BASIC_MATERIALS, // Chandra Asri (Petrochemical)
  'BRPT': IDXSector.BASIC_MATERIALS, // Barito Pacific (Petrochemical)
  'MDKA': IDXSector.BASIC_MATERIALS, // Merdeka Copper Gold
  
  // Consumer Non-Cyclicals - Food & Beverage
  'ICBP': IDXSector.CONSUMER_NON_CYCLICALS, // Indofood CBP
  'INDF': IDXSector.CONSUMER_NON_CYCLICALS, // Indofood Sukses
  'MYOR': IDXSector.CONSUMER_NON_CYCLICALS, // Mayora Indah
  'ULTJ': IDXSector.CONSUMER_NON_CYCLICALS, // Ultrajaya
  'JPFA': IDXSector.CONSUMER_NON_CYCLICALS, // Japfa Comfeed
  'MAIN': IDXSector.CONSUMER_NON_CYCLICALS, // Malindo Feedmill
  
  // Consumer Non-Cyclicals - Personal Care
  'UNVR': IDXSector.CONSUMER_NON_CYCLICALS, // Unilever Indonesia
  
  // Consumer Non-Cyclicals - Tobacco
  'GGRM': IDXSector.CONSUMER_NON_CYCLICALS, // Gudang Garam
  
  // Consumer Cyclicals - Automotive
  'ASII': IDXSector.CONSUMER_CYCLICALS, // Astra International
  
  // Consumer Cyclicals - Retail
  'AMRT': IDXSector.CONSUMER_CYCLICALS, // Sumber Alfaria (Alfamart)
  'ACES': IDXSector.CONSUMER_CYCLICALS, // Ace Hardware
  
  // Energy - Oil & Gas
  'PGAS': IDXSector.ENERGY, // Perusahaan Gas Negara
  'MEDC': IDXSector.ENERGY, // Medco Energi
  'ELSA': IDXSector.ENERGY, // Elnusa (Oil Services)
  
  // Healthcare - Pharmaceuticals
  'KLBF': IDXSector.HEALTHCARE, // Kalbe Farma
  'KAEF': IDXSector.HEALTHCARE, // Kimia Farma
  
  // Industrials - Conglomerate
  'BMTR': IDXSector.INDUSTRIALS, // Global Mediacom
  
  // Infrastructure - Telecommunications
  'TLKM': IDXSector.INFRASTRUCTURE, // Telkom Indonesia
  'EXCL': IDXSector.INFRASTRUCTURE, // XL Axiata
  'TOWR': IDXSector.INFRASTRUCTURE, // Sarana Menara Nusantara (Tower)
  'TBIG': IDXSector.INFRASTRUCTURE, // Tower Bersama
  
  // Infrastructure - Toll Roads & Utilities
  'JSMR': IDXSector.INFRASTRUCTURE, // Jasa Marga (Toll Road)
  'ADHI': IDXSector.INFRASTRUCTURE, // Adhi Karya (Construction)
  'WIKA': IDXSector.INFRASTRUCTURE, // Wijaya Karya (Construction)
  'PTRO': IDXSector.INFRASTRUCTURE, // Petrosea (Engineering)
  'ESSA': IDXSector.INFRASTRUCTURE, // Surya Esa Perkasa (Telco Infrastructure)
  
  // Properties & Real Estate
  'SMRA': IDXSector.PROPERTIES_REAL_ESTATE, // Summarecon Agung
  'APLN': IDXSector.PROPERTIES_REAL_ESTATE, // Agung Podomoro Land
  'BSDE': IDXSector.PROPERTIES_REAL_ESTATE, // Bumi Serpong Damai
  'CTRA': IDXSector.PROPERTIES_REAL_ESTATE, // Ciputra Development
  
  // Technology
  'EMTK': IDXSector.TECHNOLOGY, // Elang Mahkota Teknologi (Media)
  'MNCN': IDXSector.TECHNOLOGY, // Media Nusantara Citra
  
  // Transportation & Logistics
  'SRIL': IDXSector.TRANSPORTATION_LOGISTICS, // Sri Rejeki Isman (Logistics)
  'TOBA': IDXSector.TRANSPORTATION_LOGISTICS, // Toba Bara Sejahtra (Logistics)
  
  // Agriculture - Palm Oil & Plantation
  'AALI': IDXSector.BASIC_MATERIALS, // Astra Agro Lestari
  'LSIP': IDXSector.BASIC_MATERIALS, // PP London Sumatra
  'SGRO': IDXSector.BASIC_MATERIALS, // Sampoerna Agro
  'SSMS': IDXSector.BASIC_MATERIALS, // Sawit Sumbermas Sarana
  'SIMP': IDXSector.BASIC_MATERIALS, // Salim Ivomas Pratama
  'SMAR': IDXSector.BASIC_MATERIALS, // SMART (Golden Agri)
  'PALM': IDXSector.BASIC_MATERIALS, // Provident Agro
  'TAPG': IDXSector.BASIC_MATERIALS, // Triputra Agro Persada
  
  // Agriculture - Livestock & Feed
  'CPIN': IDXSector.CONSUMER_NON_CYCLICALS, // Charoen Pokphand Indonesia
  'AGRO': IDXSector.BASIC_MATERIALS, // Bank Rakyat Indonesia Agroniaga
  
  // Fishery & Aquaculture
  'BEST': IDXSector.CONSUMER_NON_CYCLICALS, // Bestindo
  
  // Others
  'AKRA': IDXSector.CONSUMER_CYCLICALS, // AKR Corporindo (Distribution)
  'MRAT': IDXSector.INDUSTRIALS, // Mustika Ratu (Cosmetics)
  'ERAA': IDXSector.ENERGY, // Erajaya (Electronics Distribution)
  'ASSA': IDXSector.CONSUMER_CYCLICALS, // Adi Sarana Armada (Transportation)
  'BREN': IDXSector.ENERGY, // Baramulti Suksessarana (Coal Trading)
  'IMAS': IDXSector.CONSUMER_NON_CYCLICALS, // Indomobil Multi Jasa
  'SCMA': IDXSector.CONSUMER_NON_CYCLICALS, // Surya Citra Media
  'SILO': IDXSector.INDUSTRIALS, // Siloam International Hospitals
  'AKSI': IDXSector.INDUSTRIALS, // Majapahit Securities
};

/**
 * Get sector for a stock symbol
 * @param symbol Stock symbol (with or without .JK suffix)
 * @returns Sector name or 'Unknown' if not found
 */
export function getSectorForStock(symbol: string): string {
  const cleanSymbol = symbol.replace('.JK', '').toUpperCase();
  return STOCK_SECTOR_MAP[cleanSymbol] || IDXSector.UNKNOWN;
}

/**
 * Get all stocks in a specific sector
 * @param sector Sector name
 * @returns Array of stock symbols in that sector
 */
export function getStocksInSector(sector: string): string[] {
  return Object.entries(STOCK_SECTOR_MAP)
    .filter(([_, stockSector]) => stockSector === sector)
    .map(([symbol]) => symbol);
}

/**
 * Get sector statistics
 * @returns Object with sector counts
 */
export function getSectorStatistics(): Record<string, number> {
  const stats: Record<string, number> = {};
  
  Object.values(STOCK_SECTOR_MAP).forEach(sector => {
    stats[sector] = (stats[sector] || 0) + 1;
  });
  
  return stats;
}

/**
 * Get all unique sectors
 * @returns Array of unique sector names
 */
export function getAllSectors(): string[] {
  return Array.from(new Set(Object.values(STOCK_SECTOR_MAP))).sort();
}

/**
 * Validate if a symbol has sector mapping
 * @param symbol Stock symbol
 * @returns true if sector is mapped
 */
export function hasSectorMapping(symbol: string): boolean {
  const cleanSymbol = symbol.replace('.JK', '').toUpperCase();
  return cleanSymbol in STOCK_SECTOR_MAP;
}

/**
 * Get missing sector mappings from a list of symbols
 * @param symbols Array of stock symbols
 * @returns Array of symbols without sector mapping
 */
export function getMissingSectorMappings(symbols: string[]): string[] {
  return symbols
    .map(s => s.replace('.JK', '').toUpperCase())
    .filter(s => !hasSectorMapping(s));
}
