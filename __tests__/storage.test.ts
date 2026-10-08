import { describe, expect, it } from "vitest";
import { migrate } from "../lib/storage";
import { createDefaultAppData } from "../lib/types";

describe("migrate", () => {
  it("accepts a valid LOADBEAR backup", () => {
    const data = createDefaultAppData();

    expect(migrate(data)).toEqual(data);
  });

  it("rejects data that does not match the app schema", () => {
    expect(() => migrate({ version: 1, tasks: [], classes: [] })).toThrow(
      "Stored data does not match the LOADBEAR schema.",
    );
  });

  it("rejects backups created by a newer app version", () => {
    expect(() => migrate({ version: 2 })).toThrow(
      "This LOADBEAR data was created by a newer version.",
    );
  });
});
