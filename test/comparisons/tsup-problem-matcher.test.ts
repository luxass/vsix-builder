import { it, expect, describe, beforeAll } from "vitest";
import { testdir, fromFileSystem } from "vitest-testdirs";
import { getCurrentSuite } from "vitest/suite";

describe("tsup-problem-matcher", async () => {
	// const dir = await testdir(
	// 	await fromFileSystem("./test/fixtures/extensions/tsup-problem-matchers"),
	// {
  //   cleanup: false
  // });

  const suite = getCurrentSuite();

  console.log("suite", suite);

  it("build vsce", () => {
  })
});
