import { Router } from "express";
import { GuildStates } from "../state/state.ts";

const router = Router();

router.get("/:guildId", (req, res) => {
  const guildId = req.params.guildId;
  const token = req.query.token as string;
  const state = GuildStates.get(guildId);

  if (!state) {
    return res.status(404).json({ error: "Not found" });
  }

  // トークン検証
  if (!token || token !== state.token) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // 再生中の曲とキューを返す
  res.json({
    nowPlaying: state.nowPlaying,
    queue: state.queue
  });
});

export default router;
