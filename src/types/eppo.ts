export interface EppoSearchResult {
  eppocode: string;
  fullname: string;
  codetype: string;
  prefname: string;
}

export interface EppoPestInfo {
  eppocode: string;
  prefname: string;
  taxonomy: {
    kingdom: string;
    phylum: string;
    class: string;
    order: string;
    family: string;
  };
  hosts: Array<{ eppocode: string; fullname: string }>;
  categorization: Array<{ country: string; status: string }>;
}
