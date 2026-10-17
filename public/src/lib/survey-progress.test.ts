import { describe, it } from "node:test";
import { strict as assert } from "node:assert";
import { surveyProgressPayload } from "./survey-progress";
describe("partial survey answers", () => {
  it("keeps an answered question without inventing unfinished answers", () => {
    assert.deepEqual(surveyProgressPayload([{ id: "one", kind: "yesno" }, { id: "two", kind: "scale" }], { one: 0 }, {}), [{ q: "one", o: 0 }]);
  });
  it("keeps open text from an unfinished questionnaire", () => {
    assert.deepEqual(surveyProgressPayload([{ id: "open", kind: "open" }, { id: "two" }], {}, { open: "  Più formazione  " }), [{ q: "open", t: "Più formazione" }]);
  });
});