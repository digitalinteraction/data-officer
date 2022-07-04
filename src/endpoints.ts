import { MysqlClient } from "../deps.ts";
import { fetchWithTimeout } from "./lib.ts";

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

export function getEndpoints() {
  const { MYSQL_MAIN = null, MYSQL_SHARED = null } = Deno.env.toObject();

  const endpoints: Record<string, Endpoint> = {};

  if (MYSQL_MAIN) {
    endpoints.mysql_main = mysqlEndpoint(MYSQL_MAIN, {
      name: "Mysql ~ Main",
      info: "MySQL for our websites (openlab.ncl.ac.uk & digitalcivics.io)",
      link: null,
    });
  }

  if (MYSQL_SHARED) {
    endpoints.mysql_shared = mysqlEndpoint(MYSQL_SHARED, {
      name: "Mysql ~ Shared",
      info: "MySQL for internal projects",
      link: null,
    });
  }

  endpoints.openlab = httpEndpoint("https://openlab.ncl.ac.uk", {
    name: "Main Site",
    info: "OpenLab Wordpress",
    link: "https://openlab.ncl.ac.uk",
  });

  endpoints.gitlab = httpEndpoint("https://openlab.ncl.ac.uk/gitlab", {
    name: "GitLab",
    info: "Git projects repository",
    link: "https://openlab.ncl.ac.uk/gitlab",
  });

  endpoints.digital_civics = httpEndpoint("https://digitalcivics.io", {
    name: "Digital Civics",
    info: "Digital Civics Site",
    link: "https://digitalcivics.io",
  });

  endpoints.dokku = async () => {
    const [dokku, gateway] = await Promise.all([
      fetchWithTimeout("http://dig-civics.ncl.ac.uk:8083/"),
      fetchWithTimeout("http://dig-gateway.ncl.ac.uk:8095/ping"),
    ]);

    const messages: string[] = [];
    if (!dokku.ok) {
      messages.push(
        "Cannot connect to dig-civics generator endpoint: http://dig-civics.ncl.ac.uk:8083"
      );
    }
    if (!gateway.ok) {
      messages.push(
        "Cannot connect to dig-gateway reload endpoint: http://dig-gateway.ncl.ac.uk:8095/ping"
      );
    }

    return {
      service: {
        name: "Dokku",
        info: "Shared Application Server",
        link: null,
      },
      state: {
        online: Boolean(dokku && gateway),
        status: dokku && gateway ? 200 : 400,
        messages,
      },
    };
  };

  const _svn = httpEndpoint("https://openlab.ncl.ac.uk/svn/repos/", {
    name: "svn",
    info: "Svn projects repository",
    link: "https://openlab.ncl.ac.uk/svn/repos/",
  });

  endpoints.svn = async () => {
    const r = await _svn();
    r.state.online = r.state.status === 401;
    return r;
  };

  endpoints.mysql_hosted_backup = httpEndpoint(
    "http://dig-wing.ncl.ac.uk:8086",
    {
      name: "Mainsite MySql Backup",
      info: "Automated MySQL backup for our hosted databases",
      link: null,
    }
  );

  endpoints.mysql_main_backup = httpEndpoint("http://dig-wing.ncl.ac.uk:8087", {
    name: "Mainsite MySql Backup",
    info: "Automated MySQL backup for the mainsite databases",
    link: null,
  });

  return endpoints;
}
