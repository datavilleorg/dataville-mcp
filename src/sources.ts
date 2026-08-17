export interface DataSourceInfo {
  name: string;
  description: string;
}

// Hand-maintained list of data sources supported by the Dataville API.
// Update when Dataville adds or removes a supported source.
export const DATAVILLE_SOURCES: DataSourceInfo[] = [
  { name: "wikipedia", description: "Wikipedia articles" },
  { name: "arxiv", description: "arXiv preprints" },
  { name: "gutenberg", description: "Project Gutenberg public-domain books" },
  { name: "census", description: "US Census Bureau data" },
  { name: "fooddata", description: "USDA FoodData Central" },
  { name: "pwc", description: "Papers with Code — ML papers, code, and benchmarks" },
  { name: "edgar", description: "SEC EDGAR filings" },
  { name: "openalex", description: "OpenAlex scholarly works" },
  { name: "pypi", description: "PyPI package metadata" },
  { name: "stackexchange", description: "Stack Exchange Q&A" },
];
