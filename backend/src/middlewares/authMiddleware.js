import prisma from '../config/prisma.js'
import { verifyToken } from '../utils/jwt.js'

export async function authMiddleware(req, res, next) {
  const authorization = req.headers.authorization || ''

  if (!authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Bạn chưa đăng nhập.' })
  }

  const token = authorization.slice(7).trim()
  if (!token) {
    return res.status(401).json({ message: 'Token không hợp lệ.' })
  }

  try {
    const payload = verifyToken(token)

    if (!payload.jti) {
      return res.status(401).json({ message: 'Phiên đăng nhập không hợp lệ.' })
    }

    const session = await prisma.phien_dang_nhap.findUnique({
      where: { jti: payload.jti },
    })

    const now = new Date()
    if (
      !session ||
      session.ma_nv !== payload.ma_nv ||
      session.thu_hoi_luc ||
      session.het_han <= now
    ) {
      return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn hoặc đã đăng xuất.' })
    }

    req.auth = payload
    req.authSession = session
    next()
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Phiên đăng nhập đã hết hạn.' })
    }

    return res.status(401).json({ message: 'Token không hợp lệ.' })
  }
}
