import { AcornContext } from "../deps.ts";
import { formatDuration, TwitterClient } from "./lib/mod.ts";

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

const TWITTER_API_URL = new URL("https://api.twitter.com/2/");

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

export async function uptimeRobotTweet(ctx: AcornContext) {
  const UPTIME_ROBOT_SECRET = Deno.env.get("UPTIME_ROBOT_SECRET");
  const twitter = TwitterClient.fromEnv();

  const creds = await twitter.getUpdatedCredentials();
  if (!creds) return new Response("Not authorized to tweet", { status: 500 });

  try {
    const body = (await ctx.body()) as Record<string, unknown>;

    if (!UPTIME_ROBOT_SECRET || body.secret !== UPTIME_ROBOT_SECRET) {
      return Response.json({}, { status: 401 });
    }

    // deno-lint-ignore no-explicit-any
    const alert: UpDownAlert = ctx.searchParams as any;

    const text =
      alert.alertType === "1"
        ? _monitorDownMessage(alert)
        : _monitorUpMessage(alert);

    console.log(creds);

    const endpoint = new URL("tweets", TWITTER_API_URL);
    const request = new Request(endpoint.toString(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${creds.access_token}`,
      },
      body: JSON.stringify({ text }),
    });

    const response = await fetch(request);
    if (!response.ok) return response;

    return { message: "ok" };
  } catch (error) {
    console.error(error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
