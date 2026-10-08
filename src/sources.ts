export interface DataSourceInfo {
  name: string;
  description: string;
}

export interface SqlTable {
  name: string;
  columns: string[];
}

export interface DataSourceDetails extends DataSourceInfo {
  /** What search_dataville expects as `keywords` for this source. */
  keywords: string;
  /** A `keywords` value known to return a result. */
  exampleKeywords: string;
  /**
   * Tables query_dataville can read for this source. Empty for sources that
   * are fetched live per search and never stored, so have nothing to query.
   */
  sqlTables: SqlTable[];
}

// Hand-maintained list of data sources supported by the Dataville API.
// The `name` values must match the source names the API accepts — a mismatch
// makes the source unreachable. To check against the live API, request an
// unknown source (e.g. /nosuchsource/foo); the error lists every valid name.
//
// `sqlTables` mirrors the DuckDB views the API's /api/v1/query endpoint
// exposes (backend services/duckdb.ts). The integration tests check each
// table and column against the live API.
export const DATAVILLE_SOURCE_DETAILS: DataSourceDetails[] = [
  {
    name: "wikipedia",
    description: "Wikipedia articles",
    keywords: "An article title or topic; the closest matching English Wikipedia article is returned.",
    exampleKeywords: "Machine learning",
    sqlTables: [
      {
        name: "wiki",
        columns: [
          "id", "pageid", "title", "body", "abstract", "description", "language", "url", "project",
          "is_seed", "categories", "license", "infoboxes", "citations", "tables", "main_entity", "image",
          "origin", "date_modified", "snapshot_date", "last_fetched",
        ],
      },
    ],
  },
  {
    name: "arxiv",
    description: "arXiv preprints",
    keywords: "A topic, title, or arXiv ID.",
    exampleKeywords: "transformer",
    sqlTables: [
      {
        name: "arxiv",
        columns: [
          "id", "arxiv_id", "title", "authors", "categories", "published", "abs_url", "pdf_url", "body",
          "last_updated", "last_fetched",
        ],
      },
    ],
  },
  {
    name: "gutenberg",
    description: "Project Gutenberg public-domain books",
    keywords: "A book title, author, or subject.",
    exampleKeywords: "Alice",
    sqlTables: [
      {
        name: "gutenberg",
        columns: ["id", "title", "authors", "language", "subjects", "issued", "locc", "bookshelves", "type"],
      },
    ],
  },
  {
    name: "census",
    description: "US Census Bureau data",
    keywords: "A statistic and a place, e.g. a measure such as population or median household income plus a state or county.",
    exampleKeywords: "population",
    sqlTables: [],
  },
  {
    name: "fooddata",
    description: "USDA FoodData Central",
    keywords: "A food name, optionally with a nutrient.",
    exampleKeywords: "apple",
    sqlTables: [
      { name: "fooddata", columns: ["fdc_id", "description", "category", "data_type", "nutrients"] },
    ],
  },
  {
    name: "paperswithcode",
    description: "Papers with Code — ML papers, code, and benchmarks",
    keywords: "An ML method or dataset name.",
    exampleKeywords: "transformer",
    sqlTables: [
      {
        name: "pwc_methods",
        columns: [
          "id", "name", "full_name", "description", "introduced_year", "paper_title", "paper_url", "code_url",
          "categories",
        ],
      },
      {
        name: "pwc_datasets",
        columns: [
          "id", "name", "full_name", "description", "url", "paper_title", "paper_url", "tasks", "subtasks",
          "num_papers",
        ],
      },
    ],
  },
  {
    name: "edgar",
    description: "SEC EDGAR filings",
    keywords: "A company name or stock ticker; returns its latest filing.",
    exampleKeywords: "AAPL",
    sqlTables: [
      {
        name: "edgar",
        columns: [
          "id", "accession_number", "cik", "company_name", "form_type", "filing_date", "description",
          "document_url", "index_url", "body", "last_fetched",
        ],
      },
    ],
  },
  {
    name: "openalex",
    description: "OpenAlex scholarly works",
    keywords: "A topic, title, or DOI.",
    exampleKeywords: "transformer",
    sqlTables: [
      {
        name: "openalex",
        columns: [
          "id", "openalex_id", "doi", "title", "publication_year", "publication_date", "authors", "venue",
          "cited_by_count", "type", "url", "body", "last_fetched",
        ],
      },
    ],
  },
  {
    name: "pypi",
    description: "PyPI package metadata",
    keywords: "An exact package name.",
    exampleKeywords: "requests",
    sqlTables: [
      {
        name: "pypi",
        columns: [
          "id", "name", "version", "summary", "author", "license", "home_page", "requires_python", "keywords",
          "body", "last_fetched",
        ],
      },
    ],
  },
  {
    name: "stackexchange",
    description: "Stack Exchange Q&A",
    keywords: "A programming question or topic (searches Stack Overflow).",
    exampleKeywords: "python",
    sqlTables: [
      {
        name: "stackexchange",
        columns: [
          "id", "question_id", "title", "link", "score", "tags", "owner", "site", "is_answered", "answer_count",
          "view_count", "creation_date", "body", "last_fetched",
        ],
      },
    ],
  },
  {
    name: "news",
    description: "Front-page news headlines from a historical archive (not live/current news)",
    keywords: "A topic to find archived headlines about.",
    exampleKeywords: "technology",
    sqlTables: [],
  },
];

export const DATAVILLE_SOURCES: DataSourceInfo[] = DATAVILLE_SOURCE_DETAILS.map(({ name, description }) => ({
  name,
  description,
}));

export function findSource(name: string): DataSourceDetails | undefined {
  const wanted = name.trim().toLowerCase();
  return DATAVILLE_SOURCE_DETAILS.find((s) => s.name === wanted);
}
