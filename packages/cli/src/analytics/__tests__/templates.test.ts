import { describe, it, expect } from "vitest";
import { getTemplate, getTemplateList, PROJECT_TEMPLATES } from "../../templates/index.js";

describe("Project Templates", () => {
  it("exports 9 templates", () => {
    expect(PROJECT_TEMPLATES).toHaveLength(9);
  });

  it("has required fields on all templates", () => {
    for (const t of PROJECT_TEMPLATES) {
      expect(t.id).toBeTruthy();
      expect(t.name).toBeTruthy();
      expect(t.description).toBeTruthy();
      expect(t.icpHint).toBeTruthy();
      expect(t.taskScaffold.length).toBeGreaterThan(0);
      expect(t.category).toBeTruthy();
    }
  });

  it("finds template by id", () => {
    const saas = getTemplate("saas");
    expect(saas).toBeDefined();
    expect(saas?.name).toBe("SaaS Product");
    expect(saas?.taskScaffold).toHaveLength(8);
  });

  it("returns undefined for unknown template", () => {
    expect(getTemplate("nonexistent")).toBeUndefined();
  });

  it("lists all templates", () => {
    const list = getTemplateList();
    expect(list).toHaveLength(9);
    expect(list[0]).toHaveProperty("id");
    expect(list[0]).toHaveProperty("name");
    expect(list[0]).toHaveProperty("description");
  });

  it("includes all requested template types", () => {
    const ids = PROJECT_TEMPLATES.map((t) => t.id);
    expect(ids).toContain("saas");
    expect(ids).toContain("api");
    expect(ids).toContain("mobile");
    expect(ids).toContain("cli");
    expect(ids).toContain("newsletter");
    expect(ids).toContain("agency");
    expect(ids).toContain("open-source");
    expect(ids).toContain("marketplace");
    expect(ids).toContain("ai-wrapper");
  });
});
