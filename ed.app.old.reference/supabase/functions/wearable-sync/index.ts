import { assertMethod, errorResponse, handleCors, HttpError, jsonResponse, readJsonBody } from "../_shared/http.ts";
import { requireUser } from "../_shared/supabase.ts";

type Provider = "oura" | "apple_health";

interface WearableSyncRequest {
  provider: Provider;
  data: Record<string, unknown>;
}

function readNumber(value: unknown, fallback = 0) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function computeSleepScore(remMinutes: number, deepMinutes: number, lightMinutes: number, awakeMinutes: number) {
  const totalSleep = remMinutes + deepMinutes + lightMinutes;

  if (totalSleep <= 0) {
    return 0;
  }

  const efficiency = totalSleep / Math.max(totalSleep + awakeMinutes, 1);
  const remWeight = Math.min(remMinutes / 120, 1) * 25;
  const deepWeight = Math.min(deepMinutes / 120, 1) * 35;
  const durationWeight = Math.min(totalSleep / 480, 1) * 25;
  const efficiencyWeight = efficiency * 15;

  return Math.round(remWeight + deepWeight + durationWeight + efficiencyWeight);
}

function deriveDate(payload: Record<string, unknown>) {
  const rawDate = String(payload.date ?? payload.session_date ?? new Date().toISOString().slice(0, 10));
  return rawDate.slice(0, 10);
}

Deno.serve(async (request) => {
  const corsResponse = handleCors(request);

  if (corsResponse) {
    return corsResponse;
  }

  try {
    assertMethod(request, "POST");

    const { user, adminClient } = await requireUser(request);
    const body = await readJsonBody<WearableSyncRequest>(request);

    if (!["oura", "apple_health"].includes(body.provider)) {
      throw new HttpError(400, "Unsupported wearable provider");
    }

    const remMinutes = readNumber(body.data.rem_minutes ?? body.data.remMinutes);
    const deepMinutes = readNumber(body.data.deep_minutes ?? body.data.deepMinutes);
    const lightMinutes = readNumber(body.data.light_minutes ?? body.data.lightMinutes);
    const awakeMinutes = readNumber(body.data.awake_minutes ?? body.data.awakeMinutes);
    const totalSleepMinutes = readNumber(
      body.data.total_sleep_minutes ?? body.data.totalSleepMinutes,
      remMinutes + deepMinutes + lightMinutes,
    );
    const score = readNumber(
      body.data.score,
      computeSleepScore(remMinutes, deepMinutes, lightMinutes, awakeMinutes),
    );

    const session = {
      id: String(body.data.id ?? crypto.randomUUID()),
      user_id: user.id,
      date: deriveDate(body.data),
      score,
      rem_minutes: remMinutes,
      deep_minutes: deepMinutes,
      light_minutes: lightMinutes,
      awake_minutes: awakeMinutes,
      total_sleep_minutes: totalSleepMinutes,
      source: "wearable",
      wearable_device: body.provider === "oura" ? "oura" : "apple_watch",
      raw_data: body.data,
    };

    const { data, error } = await adminClient
      .from("sleep_sessions")
      .upsert(session, { onConflict: "user_id,date" })
      .select()
      .single();

    if (error) {
      throw new HttpError(500, "Failed to upsert wearable sleep session", error);
    }

    return jsonResponse({
      sleep_session: data,
    });
  } catch (error) {
    return errorResponse(error);
  }
});
