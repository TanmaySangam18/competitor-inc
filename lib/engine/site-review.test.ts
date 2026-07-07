import { describe, it, expect } from "vitest";
import { reviewGeneratedSite } from "./site-review";

const goodApp = {
  "index.html": `<!doctype html><html><head><title>Tracker</title></head><body><h1>Habit Tracker</h1><div id="app"></div><script src="app.js"></script></body></html>`,
  "app.js": `const el=document.getElementById('app'); el.textContent='ready'; localStorage.setItem('x','1');`,
};
const goodSite = {
  "index.html": `<!doctype html><html><head><title>Co</title></head><body><h1>Co</h1><p>${"what it does ".repeat(20)}</p><form><input><button>Join</button></form></body></html>`,
};

describe("site-review — reviewer/QA gate on generated builds", () => {
  it("passes a real interactive app", () => {
    expect(reviewGeneratedSite(goodApp, "app")).toEqual({ ok: true, issues: [] });
  });
  it("passes a real static site", () => {
    expect(reviewGeneratedSite(goodSite, "site").ok).toBe(true);
  });
  it("rejects a missing index.html", () => {
    expect(reviewGeneratedSite({ "app.js": "x" }, "app").ok).toBe(false);
  });
  it("rejects a non-HTML / placeholder blob", () => {
    expect(reviewGeneratedSite({ "index.html": "TODO" }, "site").ok).toBe(false);
  });
  it("rejects a truncated page (ends mid-tag)", () => {
    const r = reviewGeneratedSite({ "index.html": `<!doctype html><html><body><h1>Hi</h1><div class="` }, "site");
    expect(r.ok).toBe(false);
    expect(r.issues.join(" ")).toMatch(/truncated/i);
  });
  it("rejects a dangling local <script src> (blank page in the browser)", () => {
    const r = reviewGeneratedSite({ "index.html": `<!doctype html><html><body><div>hi</div><script src="app.js"></script></body></html>` }, "app");
    expect(r.ok).toBe(false);
    expect(r.issues.join(" ")).toMatch(/missing local script/i);
  });
  it("rejects app mode with no JavaScript (not interactive)", () => {
    const r = reviewGeneratedSite({ "index.html": `<!doctype html><html><body><h1>${"App ".repeat(60)}</h1></body></html>` }, "app");
    expect(r.ok).toBe(false);
    expect(r.issues.join(" ")).toMatch(/no javascript/i);
  });
  it("rejects a 'coming soon' placeholder in app mode", () => {
    const r = reviewGeneratedSite({ "index.html": `<!doctype html><html><body><h1>Coming soon</h1><script>1</script></body></html>` }, "app");
    expect(r.ok).toBe(false);
    expect(r.issues.join(" ")).toMatch(/coming soon/i);
  });
  it("allows external CDN scripts (only local refs must resolve)", () => {
    const r = reviewGeneratedSite({ "index.html": `<!doctype html><html><body><div>hi</div><script src="https://cdn.example/x.js"></script></body></html>`, "app.js": "1" }, "app");
    expect(r.ok).toBe(true);
  });
});
