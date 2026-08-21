import { test } from "node:test";
import assert from "node:assert/strict";
import { searchDataSource, DatavilleApiError } from "../client.js";
import { DATAVILLE_SOURCES } from "../sources.js";

/**
 * Live integration tests against the real Dataville API.
 *
 * Skipped unless DATAVILLE_API_KEY is set, so CI and contributors without a key
 * are unaffected. Run with:
 *
 *   DATAVILLE_API_KEY=dataville_... npm run test:integration
 *
 * These exist because the source names in sources.ts are hand-maintained: a name
 * that drifts from what the API accepts makes that source silently unreachable.
 */
const hasKey = Boolean(process.env.DATAVILLE_API_KEY);

// Keyword that should return a result from every source.
const PROBES: Record<string, string> = {
  wikipedia: "Machine learning",
  arxiv: "transformer",
  gutenberg: "Alice",
  census: "population",
  fooddata: "apple",
  paperswithcode: "transformer",
  edgar: "Apple",
  openalex: "transformer",
  pypi: "requests",
  stackexchange: "python",
  news: "technology",
};

test("every declared source name is accepted by the live API", { skip: !hasKey }, async (t) => {
  for (const { name } of DATAVILLE_SOURCES) {
    await t.test(name, async () => {
      const probe = PROBES[name];
      assert.ok(probe, `no probe keyword defined for source "${name}"`);

      try {
        const result = await searchDataSource(name, probe);
        assert.equal((result as any).account_state, "authenticated");
      } catch (err) {
        // A "no results" 404 still proves the source name is valid; an
        // "Unsupported data source" error means the name is wrong.
        if (err instanceof DatavilleApiError) {
          assert.doesNotMatch(
            err.message,
            /Unsupported data source/,
            `source name "${name}" is not accepted by the API`
          );
          return;
        }
        throw err;
      }
    });
  }
});
