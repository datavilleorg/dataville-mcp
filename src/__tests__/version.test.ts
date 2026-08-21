import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { VERSION } from "../client.js";

test("VERSION matches the version in package.json", () => {
  const pkg = JSON.parse(readFileSync(new URL("../../package.json", import.meta.url), "utf8"));
  assert.equal(
    VERSION,
    pkg.version,
    `VERSION in src/client.ts (${VERSION}) must match package.json (${pkg.version})`
  );
});
