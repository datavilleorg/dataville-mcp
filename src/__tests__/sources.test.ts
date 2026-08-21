import { test } from "node:test";
import assert from "node:assert/strict";
import { DATAVILLE_SOURCES } from "../sources.js";

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
