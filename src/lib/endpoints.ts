import { MysqlClient, configMysqlLogger } from "../../deps.ts";
import { fetchWithTimeout } from "./fetch.ts";

configMysqlLogger({ enable: false });

export interface EndpointInfo {
  name: string;
  info: string;
  link: string | null;
}

export interface EndpointState {
  ok: boolean;
  httpStatus?: number;
  messages: string[];
}

export interface EndpointResult {
  service: EndpointInfo;
  state: EndpointState;
}

export interface Endpoint {
  (): Promise<EndpointResult>;
}

export function unknownState(message = "Unknown state"): EndpointState {
  return { ok: false, messages: [message] };
}

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

export function mysqlEndpoint(
  connectionString: string,
  service: EndpointInfo
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

export async function runAllEndpoints<T extends string>(
  endpoints: Record<T, Endpoint>
): Promise<Record<T, EndpointResult>> {
  const pongs: Record<string, EndpointResult> = {};
  await Promise.all(
    Object.entries(endpoints).map(async ([key, endpoint]) => {
      pongs[key] = await (endpoint as Endpoint)();
    })
  );
  return pongs;
}
