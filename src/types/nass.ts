export interface NassRecord {
  commodity_desc: string;
  statisticcat_desc: string;
  state_name: string;
  county_name: string;
  year: number;
  Value: string;
  unit_desc: string;
  source_desc: string;
  freq_desc: string;
}

export interface NassResponse {
  data: NassRecord[];
}
