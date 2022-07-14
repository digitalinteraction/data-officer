import { Command } from "../../cli.ts";
import { log, parseFlags } from "../../deps.ts";
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
    const tweets = getScheduledTweets(redis);

    const flags = parseFlags(args, {
      boolean: ["dryRun", "help"],
    });
    const tweetName = flags._[0];

    if (flags.help || !tweetName) {
      if (!tweetName) log.error("Tweet name not provided");
      console.log(CLI_USAGE(Array.from(tweets.keys())));
      return;
    }

    const tweetFn = tweets.get(tweetName as string);

    if (!tweetFn) {
      log.error("Unknown tweet", tweetName);
      Deno.exit(1);
    }

    const result = await tweetFn();

    if (flags.dryRun) {
      console.log(new Date(), result);
      return;
    }

    const creds = await twitter.getUpdatedCredentials(redis).catch((error) => {
      log.error("No Twitter authentication");
      log.error(error);
      Deno.exit(1);
    });

    await twitter.tweet(result, creds);

    redis.close();
  },
};
