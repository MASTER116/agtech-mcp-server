export interface PlantNetResult {
  score: number;
  species: {
    scientificNameWithoutAuthor: string;
    scientificNameAuthorship: string;
    genus: { scientificNameWithoutAuthor: string };
    family: { scientificNameWithoutAuthor: string };
    commonNames: string[];
  };
  gbif?: { id: number };
}

export interface PlantNetResponse {
  query: { project: string; images: string[]; organs: string[] };
  language: string;
  preferedReferential: string;
  bestMatch: string;
  results: PlantNetResult[];
  version: string;
  remainingIdentificationRequests: number;
}
