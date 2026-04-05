export interface FaostatResponse {
  data: FaostatRecord[];
}

export interface FaostatRecord {
  Area: string;
  "Area Code": string;
  Item: string;
  "Item Code": string;
  Element: string;
  "Element Code": string;
  Year: number;
  "Year Code": number;
  Unit: string;
  Value: number | null;
  Flag: string;
  "Flag Description": string;
}
