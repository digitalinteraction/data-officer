import { Command } from "../../cli.ts";
import { parseFlags } from "../../deps.ts";
import {
  getEnv,
  redisClientFromEnv,
  twitterClientFromEnv,
} from "../lib/mod.ts";
import { getScheduledTweets } from "../tweets.ts";

const CLI_USAGE = (tweets: string[]) => `
./cli.ts tweet <tweet> [options]

tweets:
  ${tweets.join("\n  ")}

options:
  --help    Show this help message
  --dryRun Output the tweet to stdout instead of tweeting
`;

export const tweetCommand: Command = {
  name: "tweet",
  info: "Tweet one of the scheduled messages",
  async fn(args) {
    const env = getEnv(
      "TWITTER_CLIENT_ID",
      "TWITTER_CLIENT_SECRET",
      "REDIS_URL",
    );

    const redis = await redisClientFromEnv(env);
    const twitter = twitterClientFromEnv(env);
    const tweets = getScheduledTweets();

    const flags = parseFlags(args, {
      boolean: ["dryRun", "help"],
    });

    if (flags.help) {
      console.log(CLI_USAGE(Array.from(tweets.keys())));
      return;
    }

    const tweetFn = tweets.get(flags._[0] as string);

    if (!tweetFn) {
      console.error("Unknown tweet", flags._[0]);
      Deno.exit(1);
    }

    const result = await tweetFn();

    if (flags.dryRun) {
      console.log(new Date(), result);
      return;
    }

    const creds = await twitter.getUpdatedCredentials(redis).catch((error) => {
      console.error("No Twitter authentication");
      console.error(error);
      Deno.exit(1);
    });

    if (creds === "already_running") throw new Error("TODO: retry here ...");

    await twitter.tweet(result, creds);

    redis.close();
  },
};
