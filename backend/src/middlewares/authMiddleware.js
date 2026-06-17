export function authMiddleware(req, res, next) {
  // Sau này kiểm tra JWT tại đây.
  next()
}
