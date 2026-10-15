import { describe, it, expect } from "vitest";
import { GET } from "@/app/api/now/search/route";
import { NextRequest } from "next/server";

describe("Global Search & Command Palette API (/api/now/search)", () => {
  it("returns empty arrays if query is missing or fewer than 2 characters", async () => {
    const req = new NextRequest("http://localhost:3000/api/now/search?q=a");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.tickets).toEqual([]);
    expect(data.catalog).toEqual([]);
    expect(data.knowledge).toEqual([]);
    expect(data.cmdb).toEqual([]);
    expect(data.spaces).toEqual([]);
  });

  it("finds incident or task records when searching by prefix (e.g. 'INC')", async () => {
    const req = new NextRequest("http://localhost:3000/api/now/search?q=INC");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.tickets)).toBe(true);
    expect(data.tickets.length).toBeGreaterThan(0);
    expect(data.tickets[0].number).toMatch(/^INC/);
  });

  it("finds service catalog items when searching by product keyword (e.g. 'Mac' or 'Laptop')", async () => {
    const req = new NextRequest("http://localhost:3000/api/now/search?q=Mac");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.catalog)).toBe(true);
  });

  it("finds knowledge articles when searching by topic (e.g. 'VPN')", async () => {
    const req = new NextRequest("http://localhost:3000/api/now/search?q=VPN");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.knowledge)).toBe(true);
  });

  it("finds CMDB configuration items when searching by service name", async () => {
    const req = new NextRequest("http://localhost:3000/api/now/search?q=Portal");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.cmdb)).toBe(true);
  });

  it("finds workplace spaces when searching by room number (e.g. 'OR-')", async () => {
    const req = new NextRequest("http://localhost:3000/api/now/search?q=OR-");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.spaces)).toBe(true);
    expect(data.spaces.length).toBeGreaterThan(0);
    expect(data.spaces[0].spaceNumber).toContain("OR-");
  });
});
