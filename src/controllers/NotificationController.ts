import { PrismaClient } from "@prisma/client";
import Controller from "./Controller";
import { Router, Request, Response } from "express";
import { body, validationResult } from "express-validator";
import NotificationResource from "../resources/NotificationResource";
import { SocketUtils } from "../utils";

const prisma = new PrismaClient();

export default class NotificationController extends Controller {
    public router: Router;

    constructor() {
        super();
        this.router = Router();
        this.routes();
    }

    public routes(): void {
        this.router.get("/", this.index);
        this.router.get("/:id", this.show);
        this.router.post("/", this.validateStore, this.store);
        this.router.put("/:id", this.update);
        this.router.delete("/:id", this.destroy);
    }

    public index = async (req: Request, res: Response) => {
        try {
            const notifications = await prisma.notification.findMany();
            return this.success(res, "Data retrieved successfully", new NotificationResource().collection(notifications));
        } catch (error) {
            return this.error(res, "Internal server error");
        }
    };

    public show = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const notification = await prisma.notification.findUnique({
                where: {
                    id: parseInt(id),
                },
            });

            if (!notification) {
                return this.error(res, "Data not found");
            }

            return this.success(res, "Data retrieved successfully", new NotificationResource().get(notification));
        } catch (error) {
            return this.error(res, "Internal server error");
        }
    };

    private validateStore = [
        body("title").notEmpty().withMessage("Title is required"),
        body("message").notEmpty().withMessage("Message is required"),
    ];

    public store = async (req: Request, res: Response) => {
        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return this.badRequest(res, "Validation errors", errors.array());
            }

            const { title, message } = req.body;
            const notification = await prisma.notification.create({
                data: {
                    title: title,
                    message: message,
                    data: req.body.data || null,
                },
            });

            const io = SocketUtils.instance().getIO();
            io.emit("new-notification", JSON.stringify(notification));

            return this.success(res, "Data created successfully", new NotificationResource().get(notification));
        } catch (error) {
            return this.error(res, "Internal server error", error);
        }
    };

    public update = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { title, body } = req.body;
            const notification = await prisma.notification.update({
                where: {
                    id: parseInt(id),
                },
                data: {
                    title: title,
                    message: body,
                    data: req.body.data || null,
                },
            });

            return this.success(res, "Data updated successfully", new NotificationResource().get(notification));
        } catch (error) {
            return this.error(res, "Internal server error", error);
        }
    };

    public destroy = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            await prisma.notification.delete({
                where: {
                    id: parseInt(id),
                },
            });

            return this.success(res, "Data deleted successfully");
        } catch (error) {
            return this.error(res, "Internal server error", error);
        }
    };
}
