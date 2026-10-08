import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { queryDataville, searchDataSource, VERSION } from "./client.js";
import { DATAVILLE_SOURCE_DETAILS, DATAVILLE_SOURCES, findSource } from "./sources.js";

const SQL_TABLES = DATAVILLE_SOURCE_DETAILS.flatMap((s) => s.sqlTables.map((t) => t.name));

const INSTRUCTIONS = `Dataville serves public datasets (Wikipedia, arXiv, SEC EDGAR, US Census, USDA FoodData, PyPI and more) through one API.

- list_dataville_sources: what sources exist.
- describe_dataville_source: what keywords a source expects, and the SQL tables and columns it has.
- search_dataville: look one thing up by keywords; returns the single best match.
- query_dataville: SQL SELECT over the stored tables, for lists, filters, counts, joins and paging through many rows.`;

function json(payload: unknown) {
  return { content: [{ type: "text" as const, text: JSON.stringify(payload, null, 2) }] };
}

function toolError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error);
  return { content: [{ type: "text" as const, text: message }], isError: true };
}

export function createServer(): McpServer {
  const server = new McpServer(
    {
      name: "dataville-mcp-server",
      version: VERSION,
    },
    { instructions: INSTRUCTIONS }
  );

  server.registerTool(
    "list_dataville_sources",
    {
      title: "List Dataville data sources",
      description:
        "List every Dataville data source with a one-line description and the SQL tables (if any) that query_dataville can read for it. " +
        "Call describe_dataville_source for a source's keyword format and table columns.",
      inputSchema: {},
      // Returns a static list bundled with the server; makes no network calls.
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async () =>
      json(
        DATAVILLE_SOURCE_DETAILS.map(({ name, description, sqlTables }) => ({
          name,
          description,
          sql_tables: sqlTables.map((t) => t.name),
        }))
      )
  );

  server.registerTool(
    "describe_dataville_source",
    {
      title: "Describe a Dataville data source",
      description:
        "Show how to use one data source: what search_dataville expects as keywords (with an example that returns a result), " +
        "and the SQL tables and columns query_dataville can read for it. Sources with no tables can only be searched.",
      inputSchema: {
        source: z.string().describe("Data source name from list_dataville_sources, e.g. 'edgar'"),
      },
      // Returns static metadata bundled with the server; makes no network calls.
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: false,
      },
    },
    async ({ source }) => {
      const details = findSource(source);
      if (!details) {
        return toolError(
          `Unknown source "${source}". Valid sources: ${DATAVILLE_SOURCES.map((s) => s.name).join(", ")}.`
        );
      }
      return json({
        name: details.name,
        description: details.description,
        search: {
          keywords: details.keywords,
          example: { source: details.name, keywords: details.exampleKeywords },
        },
        sql_tables: details.sqlTables,
        ...(details.sqlTables.length > 0
          ? { example_sql: `SELECT * FROM ${details.sqlTables[0].name} LIMIT 5` }
          : { note: "This source is fetched live per search and has no SQL table; use search_dataville." }),
      });
    }
  );

  server.registerTool(
    "search_dataville",
    {
      title: "Search a Dataville data source",
      description:
        "Look up one thing in a Dataville data source by keywords and get back the single best-matching record " +
        "(full text in `body`, structured fields in `metadata`). Use describe_dataville_source to see what keywords a source expects. " +
        "To get many records, filter, or page through results, use query_dataville instead.",
      inputSchema: {
        source: z.string().describe("Data source name, e.g. 'wikipedia', 'arxiv', 'edgar' (see list_dataville_sources)"),
        keywords: z.string().describe("Search keywords or identifier, e.g. a title, ticker, or package name"),
        summary: z
          .boolean()
          .optional()
          .describe("If true, truncate `body` to its first 100 characters to save tokens"),
        params: z
          .record(z.union([z.string(), z.number(), z.boolean()]))
          .optional()
          .describe("Extra query-string parameters passed through to the API as-is. Most callers need none."),
      },
      // A GET against the Dataville API, which fronts external data sources.
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ source, keywords, summary, params }) => {
      try {
        const query = summary === undefined ? params : { ...params, summary };
        return json(await searchDataSource(source, keywords, query));
      } catch (error) {
        return toolError(error);
      }
    }
  );

  server.registerTool(
    "query_dataville",
    {
      title: "Query Dataville with SQL",
      description:
        "Run a read-only SQL SELECT (DuckDB dialect) over Dataville's stored tables: " +
        `${SQL_TABLES.join(", ")}. ` +
        "Use it to list, filter (WHERE … ILIKE '%term%'), sort, count, aggregate, or join across sources, " +
        "and page through results with LIMIT/OFFSET. Get each table's columns from describe_dataville_source. " +
        "Only SELECT is allowed; at most 1,000 rows are returned (a missing LIMIT becomes LIMIT 1000); queries time out after 30 s. " +
        "Billed per row returned, so keep LIMIT as small as the task allows. " +
        "The tables hold Dataville's stored copy: some sources are loaded in bulk, others only hold records fetched before, " +
        "so a row missing here may still exist upstream — fall back to search_dataville for a specific item.",
      inputSchema: {
        sql: z
          .string()
          .min(1)
          .max(10_000)
          .describe("A single SELECT statement, e.g. \"SELECT company_name, form_type, filing_date FROM edgar WHERE company_name ILIKE '%apple%' ORDER BY filing_date DESC LIMIT 10\""),
      },
      // A POST, but only ever a SELECT: the API rejects anything that writes.
      annotations: {
        readOnlyHint: true,
        destructiveHint: false,
        idempotentHint: true,
        openWorldHint: true,
      },
    },
    async ({ sql }) => {
      try {
        return json(await queryDataville(sql));
      } catch (error) {
        return toolError(error);
      }
    }
  );

  return server;
}
