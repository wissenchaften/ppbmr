import { describe, expect, it } from "vitest";
import { parseMapsLink, parseMapsInfo, directionsUrl, businessMapsUrl, embedUrl } from "@/lib/maps";

describe("parseMapsLink", () => {
  it("reads place pin coordinates (!3d/!4d) over viewport @", () => {
    expect(
      parseMapsLink(
        "https://www.google.com/maps/place/Bengkel/@-7.9,112.6,17z/data=!3m1!4b1!4m6!3m5!3d-7.9666!4d112.6326",
      ),
    ).toEqual({ lat: -7.9666, lng: 112.6326 });
  });

  it("reads @lat,lng", () => {
    expect(parseMapsLink("https://www.google.com/maps/@-7.95,112.61,15z")).toEqual({
      lat: -7.95,
      lng: 112.61,
    });
  });

  it("reads plain coordinates", () => {
    expect(parseMapsLink("-7.98, 112.63")).toEqual({ lat: -7.98, lng: 112.63 });
  });

  it("returns null for short links", () => {
    expect(parseMapsLink("https://maps.app.goo.gl/abc123")).toBeNull();
  });
});

describe("parseMapsInfo", () => {
  it("extracts place name, placeId, and coordinates from Google Maps place URL", () => {
    const url =
      "https://www.google.com/maps/place/Bengkel+Mobil+Injeksi/@-7.971,112.623,17z/data=!4m6!3m5!1s0x2dd6291234:0x123456!8m2!3d-7.9754!4d112.6298";
    const info = parseMapsInfo(url);

    expect(info.placeName).toBe("Bengkel Mobil Injeksi");
    expect(info.placeId).toBe("0x2dd6291234:0x123456");
    expect(info.lat).toBe(-7.9754);
    expect(info.lng).toBe(112.6298);
    expect(info.isShortLink).toBe(false);
  });

  it("detects shortlink flags", () => {
    expect(parseMapsInfo("https://maps.app.goo.gl/xyz789").isShortLink).toBe(true);
    expect(parseMapsInfo("https://goo.gl/maps/xyz789").isShortLink).toBe(true);
  });

  it("parses query parameters with place name", () => {
    const url =
      "https://www.google.com/maps/search/?api=1&query=Bengkel+Sejahtera&query_place_id=ChIJ123456";
    const info = parseMapsInfo(url);
    expect(info.placeId).toBe("ChIJ123456");
  });
});

describe("directionsUrl targeting business place", () => {
  it("targets exact business name as destination", () => {
    const url = directionsUrl(-7.98, 112.63, {
      destinationName: "Bengkel Mandiri Jaya, Malang",
      placeId: "ChIJ123",
    });
    expect(url).toContain("destination=Bengkel%20Mandiri%20Jaya%2C%20Malang");
    expect(url).toContain("destination_place_id=ChIJ123");
  });

  it("supports legacy lat,lng origin without destinationName", () => {
    const url = directionsUrl(-7.98, 112.63, { lat: -7.9, lng: 112.6 });
    expect(url).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=-7.98,112.63&origin=-7.9,112.6",
    );
  });
});

describe("businessMapsUrl", () => {
  it("prioritizes existing mapsUrl", () => {
    expect(
      businessMapsUrl({
        mapsUrl: "https://maps.app.goo.gl/bengkel123",
        name: "Bengkel ABC",
      }),
    ).toBe("https://maps.app.goo.gl/bengkel123");
  });

  it("generates search query targeting business name and address", () => {
    const url = businessMapsUrl({
      name: "Bengkel Berkah",
      address: "Jl. Soekarno Hatta 12 Malang",
      lat: -7.95,
      lng: 112.61,
    });
    expect(url).toBe(
      "https://www.google.com/maps/search/?api=1&query=Bengkel%20Berkah%2C%20Jl.%20Soekarno%20Hatta%2012%20Malang",
    );
  });
});

describe("embedUrl", () => {
  it("includes placeName in embed query when provided", () => {
    const url = embedUrl(-7.98, 112.63, 16, "Bengkel Barokah");
    expect(url).toContain("q=Bengkel%20Barokah%2C%20-7.98%2C112.63");
  });
});
