import { Router, app } from "../deps.ts";
import { getCoffeeClubRepo } from "./coffee_club_repo.ts";
import { EndpointResult, getEndpoints } from "./endpoints.ts";
import { getOpenlabRepo } from "./openlab-repo.ts";

interface ServerOptions {
  port: number;
}

export function createServer(options: ServerOptions) {
  const router = new Router();

  router.get("/", () => ({
    app,
    message: "ok",
    routes: {
      "/": "This endpoint",
      "/healthz": "Get the health of the server",
      "/ping": {
        "/all": "Get the status of all services",
        "/down": "Get the services which are down",
        "/:name":
          "Get the status of all services, where :name is the key of the service from /all",
      },
      "/repo/": {
        "/openlab.ncl.ac.uk": {
          "/people": "Get the people on the site",
          "/projects": "Get projects",
          "/posts": "Get news items",
          "/topics": "Get project topics",
          "/publications": "Get published work",
        },
        "/coffee-club": {
          "/members": "Get club members",
        },
      },
    },
  }));

  router.get("/healthz", (ctx) => ({ message: "ok" }));

  //
  // Ping endpoints
  //
  const endpoints = getEndpoints();

  async function runAllEndpoints() {
    const pongs: Record<string, EndpointResult> = {};
    await Promise.all(
      Object.entries(endpoints).map(async ([key, endpoint]) => {
        pongs[key] = await endpoint();
      })
    );
    return pongs;
  }

  router.get("/ping/all", () => runAllEndpoints());

  router.get("/ping/down", async () => {
    const down: Record<string, EndpointResult> = {};
    for (const [id, result] of Object.entries(await runAllEndpoints())) {
      if (result.state.online) continue;
      down[id] = result;
    }
    return down;
  });

  for (const [id, endpoint] of Object.entries(endpoints)) {
    router.get(`/ping/${id}`, () => endpoint());
  }

  const repos = [getOpenlabRepo(), getCoffeeClubRepo()];

  for (const repo of repos) {
    for (const [id, collection] of Object.entries(repo.collections)) {
      router.get(`/repo/${repo.name}/${id}`, () => collection());
    }
  }

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
