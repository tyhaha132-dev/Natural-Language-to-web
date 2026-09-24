import net from "node:net";

export interface PortAllocator {
  allocate(): Promise<number>;
}

export function createPortAllocator(): PortAllocator {
  return {
    async allocate(): Promise<number> {
      return new Promise(
        (resolve, reject) => {
          const server =
            net.createServer();

          server.unref();

          server.once(
            "error",
            reject
          );

          server.listen(
            0,
            "127.0.0.1",
            () => {
              const address =
                server.address();

              if (
                address === null ||
                typeof address === "string"
              ) {
                server.close();
                reject(
                  new Error(
                    "Unable to determine allocated port"
                  )
                );
                return;
              }

              const port =
                address.port;

              server.close(
                (error) => {
                  if (error !== undefined) {
                    reject(error);
                    return;
                  }

                  resolve(port);
                }
              );
            }
          );
        }
      );
    },
  };
}
