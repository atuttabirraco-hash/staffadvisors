export const REGIONS = [
  "Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna",
  "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche",
  "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana",
  "Trentino-Alto Adige", "Umbria", "Valle d'Aosta", "Veneto",
] as const;

export const SECTORS = [
  "Restaurants", "Hotels", "Logistics & Warehouses", "Retail & Supermarkets",
  "Construction", "Factories & Manufacturing", "Offices & Call Centers",
  "Healthcare", "Transportation", "Cleaning",
] as const;

export const CONTRACT_TYPES = ["Permanent", "Fixed-term", "Seasonal", "Internship"] as const;
export type ContractType = (typeof CONTRACT_TYPES)[number];

/** Italian provincial capitals shown even before the first offer is published. */
export const ITALIAN_CITIES = [
  "Agrigento", "Alessandria", "Ancona", "Aosta", "Arezzo", "Ascoli Piceno", "Asti", "Avellino",
  "Bari", "Barletta", "Belluno", "Benevento", "Bergamo", "Biella", "Bologna", "Bolzano", "Brescia", "Brindisi",
  "Cagliari", "Caltanissetta", "Campobasso", "Carbonia", "Caserta", "Catania", "Catanzaro", "Chieti", "Como", "Cosenza", "Cremona", "Crotone", "Cuneo",
  "Enna",
  "Fermo", "Ferrara", "Firenze", "Foggia", "Forli", "Frosinone",
  "Genova", "Gorizia", "Grosseto",
  "Imperia", "Isernia",
  "L'Aquila", "La Spezia", "Latina", "Lecce", "Lecco", "Livorno", "Lodi", "Lucca",
  "Macerata", "Mantova", "Massa", "Matera", "Messina", "Milano", "Modena", "Monza",
  "Napoli", "Novara", "Nuoro",
  "Oristano",
  "Padova", "Palermo", "Parma", "Pavia", "Perugia", "Pesaro", "Pescara", "Piacenza", "Pisa", "Pistoia", "Pordenone", "Potenza", "Prato",
  "Ragusa", "Ravenna", "Reggio Calabria", "Reggio Emilia", "Rieti", "Rimini", "Roma", "Rovigo",
  "Salerno", "Sassari", "Savona", "Siena", "Siracusa", "Sondrio", "Sud Sardegna",
  "Taranto", "Teramo", "Terni", "Torino", "Trapani", "Trento", "Treviso", "Trieste",
  "Udine",
  "Varese", "Venezia", "Verbano-Cusio-Ossola", "Vercelli", "Verona", "Vibo Valentia", "Vicenza", "Viterbo",
] as const;

export const SCORE_KEYS = ["salary", "shifts", "management", "growth", "safety", "environment"] as const;
export type ScoreKey = (typeof SCORE_KEYS)[number];

/** Extra criteria asked only for hospitality sectors. 0 = not applicable, excluded from averages. */
export const EXTRA_SCORE_KEYS = ["tips", "notice", "mealLodging", "overtime"] as const;
export type ExtraScoreKey = (typeof EXTRA_SCORE_KEYS)[number];
export const EXTRA_SCORE_COLS: Record<ExtraScoreKey, string> = {
  tips: "score_tips",
  notice: "score_notice",
  mealLodging: "score_meal_lodging",
  overtime: "score_overtime",
};
/** Sectors that get the extra criteria (site sectors are stored in English). */
export const HOSPITALITY_SECTORS = ["Restaurants", "Hotels"] as const;
export const isHospitality = (sector: string | null | undefined) =>
  !!sector && (HOSPITALITY_SECTORS as readonly string[]).includes(sector);

export const MEAL_FREQ = ["daily", "some", "no", "unknown"] as const;
export const MEAL_VALUES = ["5", "6", "8", "10+"] as const;
export const MEAL_PROVIDERS = ["Ticket", "Pellegrini", "Day", "Up", "Sodexo", "Altro"] as const;
export const WELFARE_ANSWERS = ["yes", "no", "unknown"] as const;
export const WELFARE_ITEMS = ["childcare", "gym", "health", "bonus", "smart", "car"] as const;
export type WelfareItem = (typeof WELFARE_ITEMS)[number];

/** Country ISO codes for the country filter; stored value is the English name (Intl.DisplayNames). */
export const COUNTRY_CODES = [
  "IT", "AL", "AT", "BE", "BG", "HR", "CY", "CZ", "DK", "EE", "FI", "FR", "DE", "GR", "HU", "IE", "LV", "LT", "LU", "MT",
  "NL", "NO", "PL", "PT", "RO", "RS", "SK", "SI", "ES", "SE", "CH", "UA", "GB", "SM", "VA", "MC",
  "US", "CA", "MX", "BR", "AR", "CL", "CO", "PE", "MA", "TN", "EG", "ZA", "NG", "AE", "SA", "QA", "TR", "IL",
  "IN", "CN", "JP", "KR", "SG", "TH", "PH", "AU", "NZ",
] as const;
export const countryEn = (code: string) => {
  try { return new Intl.DisplayNames(["en"], { type: "region" }).of(code) ?? code; } catch { return code; }
};
