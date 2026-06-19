import { randomUUID } from 'node:crypto'
import { once } from 'node:events'
import app from '../src/app.js'
import prisma from '../src/config/prisma.js'
import { signToken, verifyToken } from '../src/utils/jwt.js'

let server
let jti

try {
  const employee = await prisma.nhanvien.findFirst({
    select: {
      ma_nv: true,
      loai_nv: true,
      ma_cn: true,
      email: true,
    },
  })

  if (!employee) {
    throw new Error('Khong co nhan vien de kiem thu.')
  }

  jti = randomUUID()
  const token = signToken(
    {
      ma_nv: employee.ma_nv,
      loai_nv: employee.loai_nv,
      ma_cn: employee.ma_cn,
    },
    { jwtid: jti },
  )
  const payload = verifyToken(token)

  await prisma.phien_dang_nhap.create({
    data: {
      jti,
      ma_nv: employee.ma_nv,
      het_han: new Date(payload.exp * 1000),
    },
  })

  server = app.listen(0)
  await once(server, 'listening')
  const port = server.address().port

  const invalidAccountResponse = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: `unknown-${randomUUID()}@example.com`,
      password: 'wrong-password',
    }),
  })
  const invalidAccountBody = await invalidAccountResponse.json()

  const wrongPasswordResponse = await fetch(`http://127.0.0.1:${port}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      username: employee.email,
      password: 'wrong-password',
    }),
  })
  const wrongPasswordBody = await wrongPasswordResponse.json()

  const logoutResponse = await fetch(`http://127.0.0.1:${port}/api/auth/logout`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })
  const logoutBody = await logoutResponse.json()

  const session = await prisma.phien_dang_nhap.findUnique({
    where: { jti },
  })

  const reusedTokenResponse = await fetch(`http://127.0.0.1:${port}/api/users`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  const result = {
    logoutStatus: logoutResponse.status,
    logoutMessage: logoutBody.message,
    revokedInDatabase: Boolean(session?.thu_hoi_luc),
    reusedTokenStatus: reusedTokenResponse.status,
    invalidAccountStatus: invalidAccountResponse.status,
    wrongPasswordStatus: wrongPasswordResponse.status,
    safeLoginMessage:
      invalidAccountBody.message === 'Sai tên đăng nhập/mật khẩu.' &&
      wrongPasswordBody.message === invalidAccountBody.message,
  }

  console.log(result)

  if (
    result.logoutStatus !== 200 ||
    !result.revokedInDatabase ||
    result.reusedTokenStatus !== 401 ||
    result.invalidAccountStatus !== 401 ||
    result.wrongPasswordStatus !== 401 ||
    !result.safeLoginMessage
  ) {
    throw new Error('Kiem thu logout that bai.')
  }
} finally {
  if (server) {
    await new Promise((resolve) => server.close(resolve))
  }

  if (jti) {
    await prisma.phien_dang_nhap.deleteMany({
      where: { jti },
    })
  }

  await prisma.$disconnect()
}
