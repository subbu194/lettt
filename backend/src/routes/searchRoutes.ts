import { Router } from "express";
import { unifiedSearch } from "../controllers/searchController";

const router = Router();

router.get("/", unifiedSearch);

export default router;
