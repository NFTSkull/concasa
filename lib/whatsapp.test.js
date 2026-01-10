import { describe, expect, it } from "vitest";

import { DEFAULT_MESSAGE, withWhatsappUrl } from "./whatsapp.js";

describe("WhatsApp deeplink", () => {
  it("agrega prefijo 52 y encodea el mensaje", () => {
    const url = withWhatsappUrl("Hola mundo", "8181781697");
    expect(url).toBe("https://wa.me/528181781697?text=Hola%20mundo");
  });

  it("no incluye la pregunta de ubicación en el mensaje base", () => {
    const lower = DEFAULT_MESSAGE.toLowerCase();
    expect(lower).not.toContain("monterrey");
    expect(lower).not.toContain("foráneo");
    expect(lower).not.toContain("foraneo");
  });
});

