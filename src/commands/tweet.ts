import { loadDotenv, parseFlags } from "../../deps.ts";
import { TwitterClient } from "../lib/mod.ts";
import { getScheduledTweets } from "../tweets.ts";

const CLI_USAGE = (tweets: string[]) => `
./cli.ts tweet <tweet> [options]

tweets:
  ${tweets.join("\n  ")}

options:
  --help    Show this help message
  --dryRun Output the tweet to stdout instead of tweeting
`;

export async function tweetCommand(args: string[]) {
  await loadDotenv({ export: true });

  const twitter = TwitterClient.fromEnv();
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

  const creds = await twitter.getUpdatedCredentials().catch((error) => {
    console.error("No Twitter authentication");
    console.error(error);
    Deno.exit(1);
  });

  await twitter.tweet(result, creds);
}
