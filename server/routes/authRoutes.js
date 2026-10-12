/*const express = require("express");

const router = express.Router();

router.get("/", (req, res) => {
    res.json({
        message: "Auth routes working"
    });
});

module.exports = router;*/

const express = require("express");
const { register, login } = require("../controllers/authController");

const router = express.Router();

router.post("/register", register);
router.post("/login", login);

module.exports = router;