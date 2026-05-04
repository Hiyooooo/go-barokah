export function errorHandler(err, req, res, next) {
  const status = err.statusCode || (err.name === "MulterError" ? 400 : 500);
  const message = err.message || "Internal server error";
  if (status >= 500) console.log(err);
  res.status(status).json({ message });
}
