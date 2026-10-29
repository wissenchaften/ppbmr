import { describe, expect, it } from "vitest";
import { parseMapsLink } from "@/lib/maps";

describe("parseMapsLink", () => {
  it("reads place pin coordinates (!3d/!4d) over viewport @", () => {
    expect(parseMapsLink("https://www.google.com/maps/place/Bengkel/@-7.9,112.6,17z/data=!3m1!4b1!4m6!3m5!3d-7.9666!4d112.6326")).toEqual({ lat: -7.9666, lng: 112.6326 });
  });
  it("reads @lat,lng", () => {
    expect(parseMapsLink("https://www.google.com/maps/@-7.95,112.61,15z")).toEqual({ lat: -7.95, lng: 112.61 });
  });
  it("reads plain coordinates", () => {
    expect(parseMapsLink("-7.98, 112.63")).toEqual({ lat: -7.98, lng: 112.63 });
  });
  it("returns null for short links", () => {
    expect(parseMapsLink("https://maps.app.goo.gl/abc123")).toBeNull();
  });
});
