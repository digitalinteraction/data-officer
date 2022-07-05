import { Router, app } from "../deps.ts";
import {
  authenticate,
  AuthzError,
  EndpointResult,
  runAllEndpoints,
} from "./lib/mod.ts";

import { getSystemsEndpoints } from "./endpoints/systems.ts";
import { getCoffeeClubRepo } from "./repos/coffee_club.ts";
import { getOpenlabRepo } from "./repos/openlab_ncl_ac_uk.ts";

interface ServerOptions {
  port: number;
}

interface NavTree {
  [key: string]: string | string[] | NavTree;
}

export function createServer(options: ServerOptions) {
  const router = new Router();

  const nav: NavTree = {
    "/": "This endpoint",
    "/healthz": "Get the health of the server",
    "/ping": {
      "/all": "Get the status of all services",
      "/down": "Get the services which are down",
      "/:service": "Get the status of a specific (get the name from /all)",
    },
  };

  router.get("/", () => {
    const reposNav: NavTree = {};
    for (const repo of repos) {
      reposNav["/" + repo.name] = Object.keys(repo.collections).map(
        (collection) => "/" + collection
      );
    }
    return {
      message: "ok",
      app,
      routes: nav,
    };
  });

  router.get("/healthz", () => ({ message: "ok" }));

  //
  // Ping endpoints
  //
  const endpoints = {
    ...getSystemsEndpoints(),
  };

  router.get("/ping/all", () => runAllEndpoints(endpoints));

  router.get("/ping/down", async () => {
    const down: Record<string, EndpointResult> = {};
    const allResults = await runAllEndpoints(endpoints);
    for (const [id, result] of Object.entries(allResults)) {
      if (result.state.online) continue;
      down[id] = result;
    }
    return down;
  });

  for (const [id, endpoint] of Object.entries(endpoints)) {
    router.get(`/ping/${id}`, async (ctx) => {
      await authenticate(`ping:${id}`, ctx);
      return endpoint();
    });
  }

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
      (collection) => "/" + collection
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
