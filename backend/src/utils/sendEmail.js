import nodemailer from 'nodemailer'

export const sendResetPasswordEmail = async (toEmail, resetLink) => {
  console.log('EMAIL_USER:', process.env.EMAIL_USER)
  console.log('EMAIL_PASS:', process.env.EMAIL_PASS)
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  })

  await transporter.sendMail({
    from: `"Homestay Dorm System" <${process.env.EMAIL_USER}>`,
    to: toEmail,
    subject: 'Đặt lại mật khẩu - Homestay Dorm System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 520px; margin: auto; padding: 24px; border: 1px solid #e0e0e0; border-radius: 12px;">
        <h2 style="color: #3b4f27;">🔒 Đặt lại mật khẩu</h2>
        <p>Xin chào,</p>
        <p>Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản của bạn tại <strong>Homestay Dorm System</strong>.</p>
        <p>Click vào nút bên dưới để đặt lại mật khẩu. Link có hiệu lực trong <strong>30 phút</strong>.</p>
        <div style="text-align: center; margin: 32px 0;">
          <a href="${resetLink}"
             style="display: inline-block; padding: 14px 32px; background: #3b4f27;
                    color: #fff; border-radius: 8px; text-decoration: none;
                    font-weight: bold; font-size: 15px;">
            Đặt lại mật khẩu
          </a>
        </div>
        <p style="color: #666; font-size: 13px;">Nếu bạn không yêu cầu điều này, hãy bỏ qua email này. Mật khẩu của bạn sẽ không thay đổi.</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
        <p style="color: #999; font-size: 12px; text-align: center;">© 2024 Homestay Dorm System</p>
      </div>
    `,
  })
}