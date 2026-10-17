import { describe, it as test } from "node:test";
import { strict as assert } from "node:assert";
import { homeDestination } from "./home-destination";

describe("account home destination", () => {
  test("business accounts use the same public home as people", () => {
    assert.equal(homeDestination(true), "/app");
  });
  test("people and guests keep the public platform home", () => {
    assert.equal(homeDestination(false), "/app");
  });
});