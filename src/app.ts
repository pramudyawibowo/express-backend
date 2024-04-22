import "dotenv/config";
import express, { Application, Request, Response } from "express";
import bodyParser from "body-parser";
import multer from "multer";
import cors from "cors";
import morgan from "morgan";
import compression from "compression";
import helmet from "helmet";
import http from "http";

import { ApiKeyMiddleware } from "./middlewares";
import { SocketUtils } from "./utils";
import { NotificationController } from "./controllers";

class App {
    public app: Application;
    public port: number;
    public server: http.Server;

    constructor(port: number) {
        this.app = express();
        this.server = http.createServer(this.app);
        this.port = port;
        this.plugins();
        this.middlewares();
        this.routes();
    }

    public plugins(): void {
        // insert plugins here
        this.app.use(bodyParser.json());
        this.app.use(multer().none());
        this.app.use(cors());
        this.app.use(morgan("dev"));
        this.app.use(compression());
        this.app.use(helmet());
    }

    public middlewares(): void {
        // insert middleware here
        this.app.use(ApiKeyMiddleware);
    }

    public routes(): void {
        // insert routes here
        this.app.use("/notifications", new NotificationController().router);

        // dont change this route (for unknown route, send 404 response)
        this.app.all("*", (req: Request, res: Response) => {
            return res.status(404).json({
                data: null,
                message: "Route not found",
                status: 404,
            });
        });
    }

    public listen(): void {
        this.server.listen(this.port, () => {
            console.log(`App listening on the http://localhost:${this.port}`);
        });

        SocketUtils.instance().initialize(this.server);

        SocketUtils.instance().getIO().on("connection", (socket) => {
            console.log("Socket connected", socket.id);
        });
    }
}

const app = new App(process.env.APP_PORT as unknown as number);
app.listen();
