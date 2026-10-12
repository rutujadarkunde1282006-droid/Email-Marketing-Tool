const express = require("express");

const {
  createCampaign,
  getCampaigns,
  getCampaign,
  deleteCampaign,
  sendCampaign,
  getCampaignAnalytics,
  getOverallAnalytics
} = require("../controllers/campaignController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

router.use(authMiddleware);

router.post("/", createCampaign);

router.get("/", getCampaigns);

router.get(
  "/analytics/overall",
  getOverallAnalytics
);

router.get("/:id", getCampaign);

router.delete("/:id", deleteCampaign);

router.post("/:id/send", sendCampaign);

router.get(
  "/:id/analytics",
  getCampaignAnalytics
);

module.exports = router;