import { afterEach, describe, expect, it, vi } from "vitest";

const { createPoolMock } = vi.hoisted(() => ({
  createPoolMock: vi.fn(() => ({
    query: vi.fn(),
  })),
}));

vi.mock("mysql2/promise", () => ({
  default: {
    createPool: createPoolMock,
  },
}));

const originalMysqlDatabaseUrl = process.env.MYSQL_DATABASE_URL;
const originalMysqlConnectionLimit = process.env.MYSQL_CONNECTION_LIMIT;
const originalMysqlSslMode = process.env.MYSQL_SSL_MODE;
const originalMysqlSslCa = process.env.MYSQL_SSL_CA;

type MysqlPoolGlobal = typeof globalThis & {
  __solarTankMysqlPool?: unknown;
};

function restoreEnv() {
  if (typeof originalMysqlDatabaseUrl === "undefined") {
    delete process.env.MYSQL_DATABASE_URL;
  } else {
    process.env.MYSQL_DATABASE_URL = originalMysqlDatabaseUrl;
  }

  if (typeof originalMysqlConnectionLimit === "undefined") {
    delete process.env.MYSQL_CONNECTION_LIMIT;
  } else {
    process.env.MYSQL_CONNECTION_LIMIT = originalMysqlConnectionLimit;
  }

  if (typeof originalMysqlSslMode === "undefined") {
    delete process.env.MYSQL_SSL_MODE;
  } else {
    process.env.MYSQL_SSL_MODE = originalMysqlSslMode;
  }

  if (typeof originalMysqlSslCa === "undefined") {
    delete process.env.MYSQL_SSL_CA;
  } else {
    process.env.MYSQL_SSL_CA = originalMysqlSslCa;
  }
}

describe("mysql connection", () => {
  afterEach(() => {
    restoreEnv();
    delete (globalThis as MysqlPoolGlobal).__solarTankMysqlPool;
    vi.resetModules();
    createPoolMock.mockClear();
  });

  it("keeps MySQL date columns as Date objects for all repositories", async () => {
    process.env.MYSQL_DATABASE_URL = "mysql://user:pass@localhost:3306/db";
    process.env.MYSQL_CONNECTION_LIMIT = "2";
    delete process.env.MYSQL_SSL_MODE;
    delete process.env.MYSQL_SSL_CA;

    const { getMysqlPool } = await import("../lib/mysql-connection");

    getMysqlPool();

    expect(createPoolMock).toHaveBeenCalledTimes(1);
    expect(createPoolMock).toHaveBeenCalledWith(
      expect.objectContaining({
        uri: "mysql://user:pass@localhost:3306/db",
        connectionLimit: 2,
        timezone: "Z",
      }),
    );
    const firstCreatePoolCall = createPoolMock.mock.calls[0] as unknown as
      | [Record<string, unknown>]
      | undefined;

    expect(firstCreatePoolCall?.[0]).not.toHaveProperty("dateStrings");
  });
});
