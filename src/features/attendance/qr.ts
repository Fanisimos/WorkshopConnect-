import "server-only";

import QRCode from "qrcode";

// Error correction "M" (~15%) survives projector glare and phone cameras at a distance.
const OPTIONS = { errorCorrectionLevel: "M" as const, margin: 2, color: { dark: "#0f172a", light: "#ffffff" } };

/** SVG markup for on-screen display (scales cleanly on projectors). */
export function qrSvg(url: string): Promise<string> {
  return QRCode.toString(url, { ...OPTIONS, type: "svg" });
}

/** High-resolution PNG for printing or slides. */
export function qrPng(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, { ...OPTIONS, type: "png", width: 1200 });
}
