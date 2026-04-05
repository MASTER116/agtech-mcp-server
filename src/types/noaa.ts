export interface NoaaDataRecord {
  date: string;
  datatype: string;
  station: string;
  attributes: string;
  value: number;
}

export interface NoaaResponse {
  metadata: {
    resultset: { offset: number; count: number; limit: number };
  };
  results: NoaaDataRecord[];
}
