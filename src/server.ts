import { app, Router } from "../deps.ts";
import {
  authenticate,
  AuthzError,
  EndpointResult,
  getEnv,
  runAllEndpoints,
  TwitterClient,
  TwitterOAuth2,
} from "./lib/mod.ts";

import { getSystemsEndpoints } from "./endpoints/systems.ts";
import { getCoffeeClubRepo } from "./repos/coffee_club.ts";
import { getOpenlabRepo } from "./repos/openlab_ncl_ac_uk.ts";
import { uptimeRobotTweet } from "./uptimerobot.ts";

interface ServerOptions {
  port: number;
}

interface NavTree {
  [key: string]: string | string[] | NavTree;
}

export function createServer(options: ServerOptions) {
  const router = new Router();

  const env = getEnv(
    "SELF_URL",
    "TWITTER_CLIENT_ID",
    "TWITTER_CLIENT_SECRET",
    "TWITTER_AUTH_SECRET",
  );

  const twitter = new TwitterClient({
    clientId: env.TWITTER_CLIENT_ID,
    clientSecret: env.TWITTER_CLIENT_SECRET,
  });
  const twitterOAuth = new TwitterOAuth2(
    twitter,
    new URL("twitter/oauth2/callback", env.SELF_URL),
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
      "/login": "Start a Twitter OAuth2 login to let the bot tweet",
      "/callback": "Finish a Twitter OAuth2 login and store credentials",
    },
  };

  const index = () => ({ message: "ok", app, routes: nav });

  router.get("/", index);
  router.get("/repos{/}?", index);
  router.get("/ping{/}?", index);

  router.get("/healthz", () => ({ message: "ok" }));
  router.post("/tweet/uptimerobot", (ctx) => uptimeRobotTweet(ctx));

  router.get("/twitter/oauth2/login", async (ctx) => {
    if (ctx.searchParams.secret !== env.TWITTER_AUTH_SECRET) {
      throw new AuthzError("Invalid secret");
    }
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
  // Ping routes
  //
  const endpoints = {
    ...getSystemsEndpoints(),
  };

  router.get("/ping/all", async (ctx) => {
    await authenticate("ping", ctx);
    return runAllEndpoints(endpoints);
  });

  router.get("/ping/down", async (ctx) => {
    await authenticate("ping", ctx);

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
      await authenticate(`ping:${id}`, ctx);
      const result = await endpoint();
      return Response.json(result, {
        status: result.state.ok ? 200 : 400,
      });
    });
  }

  //
  // Repos routes
  //

  const repos = [getOpenlabRepo(), getCoffeeClubRepo()];

  const reposNav: NavTree = {};
  nav["/repos"] = reposNav;
  for (const repo of repos) {
    for (const [id, collection] of Object.entries(repo.collections)) {
      router.get(`/repos/${repo.name}/${id}`, async (ctx) => {
        await authenticate(`${repo.name}:${id}`, ctx);
        return collection();
      });
    }

    reposNav["/" + repo.name] = Object.keys(repo.collections).map(
      (collection) => "/" + collection,
    );
  }

  router.addEventListener("error", (event) => {
    if (event.error instanceof AuthzError) {
      event.response = new Response(event.error.message, {
        status: 401,
        statusText: "Unauthorized",
      });
    } else {
      event.response = new Response("Internal Server Error", {
        status: 500,
      });
    }
  });

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
