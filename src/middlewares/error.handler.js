export function errorHandler(err, req, res, next) {
  const status = err.statusCode || (err.name === "MulterError" ? 400 : 500);
  const message = err.message || "Internal server error";
  if (status >= 500) console.log(err);

  if (status === 429 && err.details?.retry_after_seconds) {
    res.setHeader("Retry-After", err.details.retry_after_seconds);
  }

  res.status(status).json({
    message,
    ...(status === 429 &&
      err.details?.retry_after_seconds && {
        retry_after_seconds: err.details.retry_after_seconds,
      }),
  });
}
