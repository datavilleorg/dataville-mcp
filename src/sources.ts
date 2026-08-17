export interface DataSourceInfo {
  name: string;
  description: string;
}

// Mirrors the source names registered in backend/src/services/dataSource.ts.
// Hand-maintained since this package intentionally has no shared imports
// with backend/ — update this list when a new source is added there.
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
