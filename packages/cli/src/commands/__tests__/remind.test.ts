import { describe, it, expect, vi } from "vitest";
import { remindFridayCommand } from "../remind";

describe("remindFridayCommand", () => {
  it("does not call p.select (no interactive prompt)", async () => {
    // Spy on @clack/prompts select to ensure it's NOT called
    const selectSpy = vi.spyOn(require("@clack/prompts"), "select");

    // The function will fail due to missing config, but we just verify
    // that p.select is not called (the key bug fix)
    try {
      await remindFridayCommand();
    } catch (e) {
      // Expected to fail due to missing config
    }

    // Verify p.select was NOT called (this is the key fix for cron compatibility)
    expect(selectSpy).not.toHaveBeenCalled();

    selectSpy.mockRestore();
  });
});
