

  if (!username || !role) {
    return res.status(400).json({ message: 'Thiếu username hoặc role' })
  }

  // Demo login. Sau này thay bằng kiểm tra DB + JWT thật.
  return res.json({
    user: {
      id: 1,
      username,
      role,
    },
    token: 'demo-token',
  })
}
