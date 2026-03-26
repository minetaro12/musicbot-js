import { Router } from "express";

const router = Router();

router.get("/", (_, res) => {
  res.send("Music Bot is running!");
});

export default router;
