export interface DataSourceInfo {
  name: string;
  description: string;
}

// Hand-maintained list of data sources supported by the Dataville API.
// The `name` values must match the source names the API accepts — a mismatch
// makes the source unreachable. To check against the live API, request an
// unknown source (e.g. /nosuchsource/foo); the error lists every valid name.
export const DATAVILLE_SOURCES: DataSourceInfo[] = [
  { name: "wikipedia", description: "Wikipedia articles" },
  { name: "arxiv", description: "arXiv preprints" },
  { name: "gutenberg", description: "Project Gutenberg public-domain books" },
  { name: "census", description: "US Census Bureau data" },
  { name: "fooddata", description: "USDA FoodData Central" },
  { name: "paperswithcode", description: "Papers with Code — ML papers, code, and benchmarks" },
  { name: "edgar", description: "SEC EDGAR filings" },
  { name: "openalex", description: "OpenAlex scholarly works" },
  { name: "pypi", description: "PyPI package metadata" },
  { name: "stackexchange", description: "Stack Exchange Q&A" },
  { name: "news", description: "Front-page news headlines from a historical archive (not live/current news)" },
];
