import { checkInUrl } from "@/features/attendance/check-in-result";
import { qrPng } from "@/features/attendance/qr";
import { getWorkshopToken } from "@/features/attendance/queries";
import { getCurrentUser } from "@/lib/auth";
import { env } from "@/lib/env";
import { isUuid } from "@/lib/ids";

/** PNG download of a workshop's check-in QR code (owner only: RLS returns no token otherwise). */
export async function GET(_request: Request, ctx: RouteContext<"/organiser/workshops/[id]/qr/download">) {
  const { id } = await ctx.params;
  const user = await getCurrentUser();
  if (!user || user.role !== "organiser") return new Response("Not authorised", { status: 403 });
  if (!isUuid(id)) return new Response("Not found", { status: 404 });

  const token = await getWorkshopToken(id);
  if (!token) return new Response("Not found", { status: 404 });

  const png = await qrPng(checkInUrl(env.siteUrl, token));
  return new Response(new Uint8Array(png), {
    headers: {
      "Content-Type": "image/png",
      "Content-Disposition": `attachment; filename="workshop-check-in-qr.png"`,
      "Cache-Control": "private, no-store",
    },
  });
}
