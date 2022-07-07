export interface ScheduledTweet {
  (): Promise<string>;
}

export function getTweets() {
  const tweets: Record<string, ScheduledTweet> = {};

  // tweets.morningCoffee = () => {
  //   return "100 coffess this morning";
  // };

  return tweets;
}
