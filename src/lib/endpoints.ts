import { MysqlClient } from "../../deps.ts";
import { fetchWithTimeout } from "./fetch.ts";

export interface EndpointInfo {
  name: string;
  info: string;
  link: string | null;
}

export interface EndpointState {
  online: boolean;
  status: number;
  messages: string[];
}

export interface EndpointResult {
  service: EndpointInfo;
  state: EndpointState;
}

export interface Endpoint {
  (): Promise<EndpointResult>;
}

export function unknownState(): EndpointState {
  return { online: false, status: -1, messages: ["Unknown state"] };
}

export function httpEndpoint(url: string, service: EndpointInfo): Endpoint {
  return async () => {
    try {
      const res = await fetchWithTimeout(url);
      return {
        service,
        state: {
          online: res.ok,
          status: res.status,
          messages: [],
        },
      };
    } catch (error) {
      console.error(error);
      return { service, state: unknownState() };
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
      });

      await client.query("SELECT 1;");

      return { service, state: unknownState() };
    } catch (error) {
      console.error(error);
      return {
        service,
        state: {
          online: false,
          status: 400,
          messages: [],
        },
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
