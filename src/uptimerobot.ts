import { AcornContext, RedisClient } from "../deps.ts";
import { formatDuration, HttpResponse, TwitterClient } from "./lib/mod.ts";

/** https://uptimerobot.com/dashboard#mySettings */
export interface UpDownAlert {
  monitorID: string;
  monitorURL: string;
  monitorFriendlyName: string;
  alertType: string;
  alertTypeFriendlyName: string;
  alertDetails: string;
  alertDuration: string;
  monitorAlertContacts: string;
}

export function _monitorDownMessage(alert: UpDownAlert) {
  return [
    "💔 Looks like",
    alert.monitorFriendlyName,
    "is down 😓, I'll let you know when it's back up.",
  ].join(" ");
}
export function _monitorUpMessage(alert: UpDownAlert) {
  return [
    "💚",
    alert.monitorFriendlyName,
    "is back up!! 🎉 It was down for",
    formatDuration(parseFloat(alert.alertDuration) * 1000),
  ].join(" ");
}

export async function uptimeRobotTweet(
  ctx: AcornContext,
  twitter: TwitterClient,
  sharedSecret: string,
  redis: RedisClient,
) {
  const body = await ctx.body() as Record<string, unknown>;
  if (typeof body !== "object" || body?.secret !== sharedSecret) {
    return HttpResponse.unauthorized();
  }

  const creds = await twitter.getUpdatedCredentials(redis).catch((error) => {
    console.error("twitter#getUpdatedCredentials error");
    console.error(error);
    return null;
  });

  if (creds === "already_running") throw new Error("TODO: add tokens retry");

  if (!creds) return HttpResponse.internalServerError("No twitter auth");

  try {
    // deno-lint-ignore no-explicit-any
    const alert: UpDownAlert = ctx.searchParams as any;

    const text = alert.alertType === "1"
      ? _monitorDownMessage(alert)
      : _monitorUpMessage(alert);

    const response = await twitter.tweet(text, creds);
    if (!response.ok) return response;

    return { message: "ok" };
  } catch (error) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
