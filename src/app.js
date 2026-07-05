import cors from "cors";
import express from "express";
import swaggerUi from "swagger-ui-express";
import authRoute from "./routes/auth.route.js";
import addressRoute from "./routes/address.route.js";
import otpRoute from "./routes/otp.route.js";
import productRoute from "./routes/product.route.js";
import categoryRoute from "./routes/category.route.js";
import cartRoute from "./routes/cart.route.js";
import typeRoute from "./routes/type.route.js";
import orderRoute from "./routes/order.route.js";
import ownerOrderRoute from "./routes/admin-order.route.js";
import userRoute from "./routes/user.route.js";
import paymentRoute from "./routes/payment.route.js";
import expenseRoute from "./routes/expense.route.js";
import analyticsRoute from "./routes/analytics.route.js";
import employee from "./routes/employee.route.js"
import { authRequired } from "./middlewares/auth.middleware.js";
import { errorHandler } from "./middlewares/error.handler.js";

const app = express();

app.use(cors());

app.use(
  cors({
    origin: ["https://go-barokah-rho.vercel.app", "http://localhost:5173"],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }),
);

app.use(express.json());

app.use("/uploads", express.static("uploads"));
app.get("/openapi.yaml", (req, res, next) => {
  res.sendFile("openapi.yaml", { root: process.cwd() }, (error) => {
    if (error) next(error);
  });
});
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(null, {
    customSiteTitle: "Go Barokah API Docs",
    swaggerUrl: "/openapi.yaml",
  }),
);

app.get("/api/", (req, res) => {
  res.json({ message: "Ok" });
});
app.use("/api/auth", authRoute);
app.use("/api/otp", otpRoute);
app.use("/api/users/address", addressRoute);
app.use("/api/products/category", categoryRoute);
app.use("/api/products/type", typeRoute);
app.use("/api/products", productRoute);
app.use("/api/carts", cartRoute);
app.use("/api/orders", orderRoute);
app.use("/api/admin/orders", ownerOrderRoute);
app.use("/api/users", userRoute);
app.use("/api/payments", paymentRoute);
app.use("/api/owner/expenses", expenseRoute);
app.use("/api/owner/analytics", analyticsRoute);
app.use("/api/owner/employee", employee)

app.get("/me", authRequired, (req, res) => {
  res.json({ message: "Protected route", user: req.user });
});

app.use(errorHandler);

export default app;
