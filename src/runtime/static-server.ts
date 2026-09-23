import type {
  ServerProcess,
} from "./server-process.js";

import {
  createServerManager,
  type ReadinessOptions,
} from "./server-manager.js";

export interface StaticServer {
  readonly workspace: string;
  readonly port: number;
  readonly baseUrl: string;

  start(): Promise<void>;
  stop(): Promise<void>;
  isRunning(): boolean;
}

export interface StaticServerOptions {
  workspace: string;
  port: number;
  readinessTimeoutMs: number;
  readinessIntervalMs: number;
}

export function createStaticServer(
  options: StaticServerOptions
): StaticServer {
  const manager =
    createServerManager();

  let server:
    ServerProcess | null = null;

  const baseUrl =
    `http://127.0.0.1:${options.port}`;

  return {
    workspace: options.workspace,
    port: options.port,
    baseUrl,

    async start(): Promise<void> {
      if (server !== null) {
        throw new Error(
          "StaticServer is already started"
        );
      }

      const script = `
        const fs = require("node:fs");
        const path = require("node:path");
        const http = require("node:http");

        const workspace =
          process.argv[1];

        const port =
          Number(process.argv[2]);

        const workspaceRoot =
          path.resolve(workspace);

        const server =
          http.createServer(
            (request, response) => {
              let requestPath =
                request.url || "/";

              requestPath =
                requestPath.split("?")[0];

              if (requestPath === "/") {
                requestPath = "/index.html";
              }

              let relativePath =
                requestPath;

              if (
                relativePath.startsWith("/")
              ) {
                relativePath =
                  relativePath.slice(1);
              }

              relativePath =
                decodeURIComponent(
                  relativePath
                );

              const filePath =
                path.resolve(
                  workspaceRoot,
                  relativePath
                );

              const relative =
                path.relative(
                  workspaceRoot,
                  filePath
                );

              if (
                relative.startsWith("..") ||
                path.isAbsolute(relative)
              ) {
                response.writeHead(403);
                response.end("Forbidden");
                return;
              }

              if (
                !fs.existsSync(filePath)
              ) {
                response.writeHead(404);
                response.end("Not Found");
                return;
              }

              const stats =
                fs.statSync(filePath);

              if (!stats.isFile()) {
                response.writeHead(404);
                response.end("Not Found");
                return;
              }

              const content =
                fs.readFileSync(filePath);

              response.writeHead(
                200,
                {
                  "Content-Type":
                    "text/html; charset=utf-8"
                }
              );

              response.end(content);
            }
          );

        server.listen(
          port,
          "127.0.0.1"
        );
      `;

      server =
        manager.start(
          {
            command: process.execPath,
            args: [
              "-e",
              script,
              options.workspace,
              String(options.port),
            ],
          },
          options.workspace
        );

      const readiness:
        ReadinessOptions = {
        url: baseUrl,
        timeoutMs:
          options.readinessTimeoutMs,
        intervalMs:
          options.readinessIntervalMs,
      };

      try {
        await manager.waitUntilReady(
          server,
          readiness
        );
      } catch (error) {
        await manager.stop(server);
        server = null;
        throw error;
      }
    },

    async stop(): Promise<void> {
      if (server === null) {
        return;
      }

      const currentServer = server;

      server = null;

      await manager.stop(
        currentServer
      );
    },

    isRunning(): boolean {
      return (
        server !== null &&
        server.isRunning()
      );
    },
  };
}
