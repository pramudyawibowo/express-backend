import { Server, ServerOptions } from "socket.io";
import { Server as HttpServer } from "http";

export class SocketUtils {
    private static _instance: SocketUtils | undefined;
    private static server: Server | undefined;

    static instance(): SocketUtils {
        if (!SocketUtils._instance) {
            SocketUtils._instance = new SocketUtils();
        }

        return SocketUtils._instance;
    }

    initialize(server: HttpServer, options?: Partial<ServerOptions>): Server {
        SocketUtils.server = new Server(server, options);
        return SocketUtils.server;
    }

    getIO(): Server {
        if (!SocketUtils.server) {
            throw new Error("Please call initialize first");
        }

        return SocketUtils.server;
    }
}