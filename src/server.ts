import { app, connectToRedis, parseRedisUrl, Router } from "../deps.ts";
import {
  AuthService,
  AuthzError,
  EndpointResult,
  getCollectionKey,
  getEnv,
  runAllEndpoints,
  TwitterClient,
  TwitterOAuth2,
} from "./lib/mod.ts";

import { getSystemsEndpoints } from "./endpoints/systems.ts";
import { uptimeRobotTweet } from "./uptimerobot.ts";
import { getAllRepos } from "./repos/all.ts";

interface ServerOptions {
  port: number;
  // syncRepos: boolean;
  // verboseSync: boolean;
}

interface NavTree {
  [key: string]: string | string[] | NavTree;
}

// const SYNC_INTERVAL = 2 * 60 * 1000;

export async function createServer(options: ServerOptions) {
  const router = new Router();

  const env = getEnv(
    "SELF_URL",
    "TWITTER_CLIENT_ID",
    "TWITTER_CLIENT_SECRET",
    "JWT_SECRET",
    "UPTIME_ROBOT_SECRET",
    "REDIS_URL",
  );

  const auth = new AuthService(env.JWT_SECRET, app.jwtIssuer);

  const twitter = new TwitterClient({
    clientId: env.TWITTER_CLIENT_ID,
    clientSecret: env.TWITTER_CLIENT_SECRET,
  });
  const twitterOAuth = new TwitterOAuth2(
    twitter,
    new URL("twitter/oauth2/callback", env.SELF_URL),
  );

  const redis = await connectToRedis(
    parseRedisUrl(env.REDIS_URL),
  );

  const nav: NavTree = {
    "/": "This endpoint",
    "/healthz": "Get the health of the server",
    "/ping": {
      "/all": "Get the status of all services",
      "/down": "Get the services which are down",
      "/:service": "Get the status of a specific (get the name from /all)",
    },
    "/twitter/oauth2": {
      "/health": "Whether the server is authenticated to tweet",
      "/login": "Start a Twitter OAuth2 login to let the bot tweet",
      "/callback": "Finish a Twitter OAuth2 login and store credentials",
    },
  };

  const index = (nav: unknown) => ({ message: "ok", app, routes: nav });

  router.get("/", () => index(nav));
  router.get("/repos{/}?", () => index(nav["/repos"]));
  router.get("/ping{/}?", () => index(nav["/ping"]));
  router.get("/healthz", () => ({ message: "ok" }));

  //
  // Tweet endpoint
  //
  router.post("/tweet/uptimerobot", (ctx) => {
    return uptimeRobotTweet(ctx, twitter, env.UPTIME_ROBOT_SECRET);
  });

  //
  // Twitter OAuth2
  //
  router.get("/twitter/oauth2/health", async () => {
    const creds = await twitter.getHealth();
    return creds
      ? new Response("Ok")
      : new Response("Bad credentials", { status: 400 });
  });
  router.get("/twitter/oauth2/login", async (ctx) => {
    await auth.authenticate(ctx, "twitter:oauth2");
    const url = await twitterOAuth.startLogin();
    return url
      ? Response.redirect(url.toString())
      : new Response("Already authorized");
  });
  router.get("/twitter/oauth2/callback", async (ctx) => {
    const { code, state } = ctx.searchParams;
    const success = await twitterOAuth.finishLogin(state, code);
    return success
      ? new Response("Successfully authorized")
      : new Response("Authorization failed", { status: 400 });
  });

  //
  // Admin
  //
  router.post("/admin/token", async (ctx) => {
    await auth.authenticate(ctx, "admin");
    const token = await auth.signFromRequest(await ctx.body());
    return token
      ? new Response(token)
      : new Response("Bad request", { status: 400 });
  });

  //
  // Ping routes
  //
  const endpoints = {
    ...getSystemsEndpoints(),
  };

  router.get("/ping/all", async (ctx) => {
    await auth.authenticate(ctx, "ping");
    return runAllEndpoints(endpoints);
  });

  router.get("/ping/down", async (ctx) => {
    await auth.authenticate(ctx, "ping");

    const down: Record<string, EndpointResult> = {};
    const allResults = await runAllEndpoints(endpoints);
    for (const [id, result] of Object.entries(allResults)) {
      if (result.state.ok) continue;
      down[id] = result;
    }
    return Response.json(down, {
      status: Object.keys(down).length === 0 ? 200 : 400,
    });
  });

  (nav["/ping"] as NavTree)["/:service"] = Object.keys(endpoints).sort();
  for (const [id, endpoint] of Object.entries(endpoints)) {
    router.get(`/ping/${id}`, async (ctx) => {
      await auth.authenticate(ctx, ["ping", `ping:${id}`]);
      const result = await endpoint();
      return Response.json(result, {
        status: result.state.ok ? 200 : 400,
      });
    });
  }

  //
  // Repos routes
  //
  const repos = getAllRepos();

  const reposNav: NavTree = {};
  nav["/repos"] = reposNav;
  for (const repo of repos) {
    for (const id of Object.keys(repo.collections)) {
      const key = getCollectionKey(repo.name, id);
      router.get(`/repos/${repo.name}/${id}`, async () => {
        const data = await redis.get(key);
        return data
          ? new Response(data)
          : new Response("Internal server error", { status: 500 });
      });
    }

    reposNav["/" + repo.name] = Object.keys(repo.collections).map(
      (collection) => "/" + collection,
    );
  }

  //
  // Error handler
  //
  router.addEventListener("error", (event) => {
    if (event.error instanceof AuthzError) {
      event.response = new Response(event.error.message, {
        status: 401,
        statusText: "Unauthorized",
      });
    } else {
      console.error(event.error);
      event.response = new Response("Internal Server Error", {
        status: 500,
      });
    }
  });

  //
  // Repos sync
  //
  // if (options.syncRepos) {
  //   syncRepos(options.verboseSync);
  //   setInterval(
  //     async () => await syncRepos(options.verboseSync),
  //     SYNC_INTERVAL,
  //   );
  // }

  return {
    async start() {
      console.log("starting server on :" + options.port);
      await router.listen({ port: options.port });
    },
    stop() {
      // ...
    },
  };
}
