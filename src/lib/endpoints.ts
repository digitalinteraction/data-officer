import { configMysqlLogger, MysqlClient } from "../../deps.ts";
import { fetchWithTimeout } from "./fetch.ts";

// mysql's logging is noisy by default
configMysqlLogger({ enable: false });

/** A description of an endpoint and optional URL to visit it */
export interface EndpointInfo {
  name: string;
  info: string;
  link: string | null;
}

/** The result of querying an endpoint to see if its ok or not */
export interface EndpointState {
  ok: boolean;
  httpStatus?: number;
  messages: string[];
}

/** The result from pinging an endpoint, combining it's info and current state */
export interface EndpointResult {
  service: EndpointInfo;
  state: EndpointState;
}

/** An endpoint definition, a function to get an `EndpointResult` */
export interface Endpoint {
  (): Promise<EndpointResult>;
}

/** A helper to return an unknown endpoint state */
export function unknownState(message = "Unknown state"): EndpointState {
  return { ok: false, messages: [message] };
}

/** An endpoint that checks a http request passes */
export function httpEndpoint(url: string, service: EndpointInfo): Endpoint {
  return async () => {
    try {
      const res = await fetchWithTimeout(url);
      return {
        service,
        state: {
          ok: res.ok,
          httpStatus: res.status,
          messages: [],
        },
      };
    } catch (error) {
      return { service, state: unknownState(error.message) };
    }
  };
}

/** An endpoint that pings a MySQL server */
export function mysqlEndpoint(
  connectionString: string,
  service: EndpointInfo,
): Endpoint {
  return async () => {
    try {
      const url = new URL(connectionString);
      const port = Number.isNaN(url.port) ? undefined : parseInt(url.port);
      const database = url.pathname.replace(/^\/+/, "");

      const client = new MysqlClient();
      await client.connect({
        hostname: url.hostname,
        username: url.username,
        port: port,
        password: url.password,
        db: database,
        debug: false,
      });

      await client.query("SELECT 1;");

      await client.close();

      return {
        service,
        state: { ok: true, messages: [] },
      };
    } catch (error) {
      return {
        service,
        state: { ok: false, messages: [error.message] },
      };
    }
  };
}

/** Run a set of endpoints in parallel and get all the results */
export async function runAllEndpoints<T extends string>(
  endpoints: Record<T, Endpoint>,
): Promise<Record<T, EndpointResult>> {
  const pongs: Record<string, EndpointResult> = {};
  await Promise.all(
    Object.entries(endpoints).map(async ([key, endpoint]) => {
      pongs[key] = await (endpoint as Endpoint)();
    }),
  );
  return pongs;
}
