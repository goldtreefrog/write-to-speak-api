// Log requests to terminal
const logRequest = (req, res, next) => {
  const logObj = {
    time: new Date().toTimeString(),
    method: req.method,
    hostname: req.hostname,
    path: req.path,
    "content type": req.get("Content-Type"),
    query: JSON.stringify(req.query),
    body: JSON.stringify(req.body)
  };
  console.dir(logObj);
  // calling `next()` causes the next function in the middleware stack to be called
  next();
};

module.exports = logRequest;
