export interface SoilGridsPropertyResponse {
  type: string;
  geometry: {
    type: string;
    coordinates: number[];
  };
  properties: {
    layers: Array<{
      name: string;
      unit_measure: {
        mapped_units: string;
        target_units: string;
        d_factor: number;
      };
      depths: Array<{
        label: string;
        range: { top_depth: number; bottom_depth: number; unit_depth: string };
        values: Record<string, number>;
      }>;
    }>;
  };
}

export interface SoilGridsClassificationResponse {
  type: string;
  geometry: {
    type: string;
    coordinates: number[];
  };
  properties: {
    most_probable: string;
    probabilities: Array<{
      label: string;
      probability: number;
    }>;
  };
}
