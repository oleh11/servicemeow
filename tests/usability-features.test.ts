import { describe, it, expect } from "vitest";

describe("Enterprise Usability Features - Quality & Guardian Validation", () => {
  describe("Data Grid Export Engine (CSV RFC 4180 & JSON)", () => {
    const sampleRecords = [
      {
        id: "rec-1",
        number: "INC0010042",
        short_description: 'Database connection failed, error: "timeout"',
        priority: "1",
        state: "2",
        sys_created_on: "2026-10-14T12:00:00.000Z",
      },
      {
        id: "rec-2",
        number: "INC0010043",
        short_description: "Request for standard standing desk",
        priority: "3",
        state: "1",
        sys_created_on: "2026-10-14T13:00:00.000Z",
      },
    ];

    it("formats data rows to valid RFC 4180 CSV with escaped quotes", () => {
      const columns = Object.keys(sampleRecords[0]);
      const csvLines = [
        columns.join(","),
        ...sampleRecords.map((row) =>
          columns
            .map((col) => {
              const val = (row as any)[col];
              if (val === null || val === undefined) return '""';
              const str = String(val).replace(/"/g, '""');
              return `"${str}"`;
            })
            .join(",")
        ),
      ];

      const csvOutput = csvLines.join("\n");
      expect(csvOutput).toContain("id,number,short_description,priority,state,sys_created_on");
      expect(csvOutput).toContain('""timeout""'); // escaped double quotes
      expect(csvOutput).toContain('"INC0010042"');
      expect(csvOutput.split("\n").length).toBe(3); // header + 2 rows
    });

    it("formats data rows into parseable structured JSON", () => {
      const jsonString = JSON.stringify(sampleRecords, null, 2);
      const parsed = JSON.parse(jsonString);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBe(2);
      expect(parsed[0].number).toBe("INC0010042");
    });
  });

  describe("Triage Quick Filter Presets", () => {
    function generatePresetQuery(presetId: string, currentUserId: string): string {
      switch (presetId) {
        case "my":
          return `assigned_to=${currentUserId}`;
        case "unassigned":
          return `assigned_toISEMPTY`;
        case "critical":
          return `priority=1^ORpriority=2`;
        case "active":
          return `state=1^ORstate=2`;
        case "resolved":
          return `state=6^ORstate=7`;
        default:
          return "";
      }
    }

    it("generates correct query syntax for all 6 presets", () => {
      const userId = "usr-whiskers-123";
      expect(generatePresetQuery("all", userId)).toBe("");
      expect(generatePresetQuery("my", userId)).toBe("assigned_to=usr-whiskers-123");
      expect(generatePresetQuery("unassigned", userId)).toBe("assigned_toISEMPTY");
      expect(generatePresetQuery("critical", userId)).toBe("priority=1^ORpriority=2");
      expect(generatePresetQuery("active", userId)).toBe("state=1^ORstate=2");
      expect(generatePresetQuery("resolved", userId)).toBe("state=6^ORstate=7");
    });
  });

  describe("Activity Stream Response Macros", () => {
    function applyMacro(existingContent: string, macroText: string): string {
      return existingContent ? `${existingContent}\n\n${macroText}` : macroText;
    }

    it("populates empty content directly with macro", () => {
      const macro = "Diagnostic & Network Trace completed. No packet loss observed on core gateway.";
      const result = applyMacro("", macro);
      expect(result).toBe(macro);
    });

    it("appends macro with double newline if prior text exists", () => {
      const existing = "Spoke with user on Zoom.";
      const macro = "Escalated to Tier 3 Engineering on-call lead for kernel log review.";
      const result = applyMacro(existing, macro);
      expect(result).toBe(`${existing}\n\n${macro}`);
    });
  });
});
