/**
 * Stock universe presets for screening
 * - lq45, idx80, popular: Curated liquid stocks (fast screening)
 * - liquid: LQ45 + IDX80 combined (~80 stocks)
 * - syariah: Shariah-compliant stocks from DES (Daftar Efek Syariah)
 * - all: Full IDX list ~955 stocks (screening may take 5-10 min)
 */
import ALL_TICKERS from '@/data/tickers.json';

export const UNIVERSES: Record<string, string[]> = {
  lq45: [
    'BBCA', 'BBRI', 'BMRI', 'BBNI', 'TLKM', 'ASII', 'GOTO', 'GGRM', 'UNVR', 'ICBP',
    'INDF', 'INCO', 'ANTM', 'ADRO', 'CPIN', 'BRPT', 'TOWR', 'BUKA', 'EMTK', 'PGAS',
    'KLBF', 'INTP', 'ASSA', 'MDKA', 'ADHI', 'ACES', 'EXCL', 'TPIA', 'ITMG', 'BREN',
    'FREN', 'AKRA', 'MRAT', 'WIKA', 'SMGR', 'SMCB', 'JSMR', 'SRIL', 'TOBA', 'PTBA',
    'BRMS', 'HRUM', 'AMRT', 'BMTR', 'BEST', 'ERAA',
  ],
  idx80: [
    'BBCA', 'BBRI', 'BMRI', 'BBNI', 'TLKM', 'ASII', 'GOTO', 'GGRM', 'UNVR', 'ICBP',
    'INDF', 'INCO', 'ANTM', 'ADRO', 'CPIN', 'BRPT', 'TOWR', 'BUKA', 'EMTK', 'PGAS',
    'KLBF', 'INTP', 'ASSA', 'MDKA', 'ADHI', 'ACES', 'EXCL', 'TPIA', 'ITMG', 'BREN',
    'FREN', 'AKRA', 'MRAT', 'WIKA', 'SMGR', 'SMCB', 'JSMR', 'SRIL', 'TOBA', 'PTBA',
    'BRMS', 'HRUM', 'AMRT', 'BMTR', 'BEST', 'ERAA', 'BBNI', 'BDMN', 'BNGA', 'BJBR',
    'BACA', 'BBYB', 'BNLI', 'AGRO', 'LSIP', 'SGRO', 'SSMS', 'SIMP', 'SMRA', 'APLN',
    'BSDE', 'CTRA', 'JBSS', 'INDF', 'TINS', 'KAEF', 'AALI', 'CPIN', 'ICBP', 'ULTJ',
  ],
  popular: [
    'BBCA', 'BBRI', 'BMRI', 'BBNI', 'TLKM', 'ASII', 'GOTO', 'GGRM', 'UNVR', 'ICBP',
    'INDF', 'INCO', 'ANTM', 'ADRO', 'CPIN', 'BRPT', 'TOWR', 'BUKA', 'EMTK', 'PGAS',
    'KLBF', 'INTP', 'ASSA', 'MDKA', 'ADHI', 'ACES', 'EXCL', 'TPIA', 'ITMG', 'BREN',
    'FREN', 'AKRA', 'MRAT', 'WIKA', 'SMGR', 'SMCB', 'JSMR', 'SRIL', 'TOBA', 'PTBA',
  ],
  liquid: [
    ...new Set([
      ...['BBCA', 'BBRI', 'BMRI', 'BBNI', 'TLKM', 'ASII', 'GOTO', 'GGRM', 'UNVR', 'ICBP',
        'INDF', 'INCO', 'ANTM', 'ADRO', 'CPIN', 'BRPT', 'TOWR', 'BUKA', 'EMTK', 'PGAS',
        'KLBF', 'INTP', 'ASSA', 'MDKA', 'ADHI', 'ACES', 'EXCL', 'TPIA', 'ITMG', 'BREN',
        'FREN', 'AKRA', 'MRAT', 'WIKA', 'SMGR', 'SMCB', 'JSMR', 'SRIL', 'TOBA', 'PTBA',
        'BRMS', 'HRUM', 'AMRT', 'BMTR', 'BEST', 'ERAA'],
      ...['BBNI', 'BDMN', 'BNGA', 'BJBR', 'BACA', 'BBYB', 'BNLI', 'AGRO', 'LSIP', 'SGRO',
        'SSMS', 'SIMP', 'SMRA', 'APLN', 'BSDE', 'CTRA', 'JBSS', 'TINS', 'KAEF', 'AALI', 'ULTJ'],
    ]),
  ],
  // Shariah-compliant stocks (DES - Daftar Efek Syariah)
  // Based on common syariah stocks from LQ45 and IDX80 (excluding banks and non-halal sectors)
  syariah: [
    'TLKM', 'ASII', 'UNVR', 'ICBP', 'INDF', 'INCO', 'ANTM', 'ADRO', 'CPIN', 'BRPT',
    'TOWR', 'EMTK', 'PGAS', 'KLBF', 'INTP', 'ASSA', 'MDKA', 'ADHI', 'ACES', 'EXCL',
    'TPIA', 'ITMG', 'BREN', 'FREN', 'AKRA', 'MRAT', 'WIKA', 'SMGR', 'SMCB', 'JSMR',
    'SRIL', 'TOBA', 'PTBA', 'BRMS', 'HRUM', 'AMRT', 'BMTR', 'BEST', 'ERAA', 'AGRO',
    'LSIP', 'SGRO', 'SSMS', 'SIMP', 'SMRA', 'APLN', 'BSDE', 'CTRA', 'JBSS', 'TINS',
    'KAEF', 'AALI', 'ULTJ', 'MYOR', 'IMAS', 'SMAR', 'SCMA', 'DOID', 'PALM', 'TAPG',
    'MEDC', 'JPFA', 'MAIN', 'SILO', 'PTRO', 'ELSA', 'ESSA', 'MNCN', 'TBIG', 'AKSI',
  ],
  all: ALL_TICKERS as string[],
};
