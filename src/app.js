import express from "express";
import authRoute from "./routes/auth.route.js";
import { authRequired } from "./middlewares/auth.midleware.js";
import { errorHandler } from "./middlewares/error.handler.js";

const app = express();
app.use(express.json());

app.get("/", (req, res) => {
    res.json({ message: "Ok" });
});
app.use("/auth", authRoute);

app.get("/me", authRequired, (req, res) => {
    res.json({ message: "Protected route", user: req.user });
});

app.use(errorHandler);

export default app;
