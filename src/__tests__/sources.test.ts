import { test } from "node:test";
import assert from "node:assert/strict";
import { DATAVILLE_SOURCES, DATAVILLE_SOURCE_DETAILS, findSource } from "../sources.js";

test("every source has a non-empty name and description", () => {
  for (const source of DATAVILLE_SOURCES) {
    assert.ok(source.name.length > 0);
    assert.ok(source.description.length > 0);
  }
});

test("source names are unique", () => {
  const names = DATAVILLE_SOURCES.map((s) => s.name);
  assert.equal(new Set(names).size, names.length);
});

test("every source says what keywords it expects, with an example", () => {
  for (const source of DATAVILLE_SOURCE_DETAILS) {
    assert.ok(source.keywords.length > 0, `${source.name} has no keywords guidance`);
    assert.ok(source.exampleKeywords.length > 0, `${source.name} has no example keywords`);
  }
});

test("SQL table names are unique and every table has columns", () => {
  const tables = DATAVILLE_SOURCE_DETAILS.flatMap((s) => s.sqlTables);
  assert.equal(new Set(tables.map((t) => t.name)).size, tables.length);
  for (const table of tables) {
    assert.ok(table.columns.length > 0, `${table.name} has no columns`);
    assert.equal(new Set(table.columns).size, table.columns.length, `${table.name} repeats a column`);
  }
});

test("findSource ignores case and surrounding whitespace", () => {
  assert.equal(findSource("  PyPI ")?.name, "pypi");
  assert.equal(findSource("nosuchsource"), undefined);
});
