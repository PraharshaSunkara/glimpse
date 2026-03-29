import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { CameraRepository } from "./repositories/cameraRepository";

const cameras = new CameraRepository();

const app = new Elysia()
  .use(
    cors({
      origin: "http://localhost:5173",
    })
  )
  .get("/health", () => ({ status: "ok" }))
  .get("/api/cameras", () => cameras.getAll())
  .get(
    "/api/cameras/:id",
    ({ params, set }) => {
      const camera = cameras.getById(params.id);
      if (!camera) {
        set.status = 404;
        return { message: "Camera not found" };
      }
      return camera;
    },
    {
      params: t.Object({
        id: t.String({ minLength: 1 }),
      }),
    }
  )
  .listen(3001);

console.log(`Backend running at http://localhost:${app.server?.port}`);
