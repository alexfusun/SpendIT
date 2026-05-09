import "reflect-metadata";
import { Logger } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

function parsePort(): number {
  const fromEnv = process.env.PORT;
  if (fromEnv === undefined || fromEnv === "") {
    return 3001;
  }
  const n = Number(fromEnv);
  return Number.isFinite(n) && n >= 0 ? n : 3001;
}

function isAddrInUse(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "code" in err &&
    (err as NodeJS.ErrnoException).code === "EADDRINUSE"
  );
}

async function bootstrap() {
  const logger = new Logger("Bootstrap");
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix("api");
  app.enableCors({
    origin: process.env.WEB_ORIGIN ?? "http://localhost:3000",
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  });

  const preferred = parsePort();
  const isProd = process.env.NODE_ENV === "production";
  const maxPortTries = isProd ? 1 : 10;

  let port = preferred;
  for (let i = 0; i < maxPortTries; i++) {
    try {
      await app.listen(port);
      if (port !== preferred) {
        logger.warn(
          `Port ${preferred} was in use; listening on ${port} instead. Set PORT=${port} in .env if your frontend targets this API.`,
        );
      }
      return;
    } catch (err) {
      if (isAddrInUse(err) && i < maxPortTries - 1) {
        logger.warn(`Port ${port} is already in use, trying ${port + 1}…`);
        port += 1;
        continue;
      }
      throw err;
    }
  }
}

bootstrap();
