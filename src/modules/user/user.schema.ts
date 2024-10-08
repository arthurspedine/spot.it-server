import z from 'zod'

export const createUserSchema = z.object({
  name: z
    .string()
    .min(2, 'O nome deve ter pelo menos 2 caracteres.')
    .max(50, 'O nome deve ter no máximo 50 caracteres.'),
  username: z
    .string()
    .min(3, 'O username deve ter pelo menos 3 caracteres.')
    .max(20, 'O username deve ter no máximo 20 caracteres.')
    .regex(
      /^[a-zA-Z0-9_]+$/,
      'O username deve conter apenas letras, números e sublinhados.'
    ),
  email: z
    .string()
    .email('Formato de email inválido.')
    .max(100, 'O email deve ter no máximo 100 caracteres.'),
  password: z
    .string()
    .min(8, 'A senha deve ter pelo menos 8 caracteres.')
    .max(128, 'A senha deve ter no máximo 128 caracteres.')
    .regex(/[A-Z]/, 'A senha deve conter pelo menos uma letra maiúscula.')
    .regex(/[a-z]/, 'A senha deve conter pelo menos uma letra minúscula.')
    .regex(/[0-9]/, 'A senha deve conter pelo menos um número.')
    .regex(
      /[^A-Za-z0-9]/,
      'A senha deve conter pelo menos um caractere especial.'
    ),
  profilePicture: z.string().min(1),
})

export type CreateUserInput = z.infer<typeof createUserSchema>

export const loginSchema = z.object({
  identifier: z
    .union([
      z
        .string()
        .email('Formato de email inválido.')
        .max(100, 'O email deve ter no máximo 100 caracteres.'),
      z
        .string()
        .min(3, 'O username deve ter pelo menos 3 caracteres.')
        .max(20, 'O username deve ter no máximo 20 caracteres.')
        .regex(
          /^[a-zA-Z0-9_]+$/,
          'O username deve conter apenas letras, números e sublinhados.'
        ),
    ])
    .refine(val => val.includes('@') || /^[a-zA-Z0-9_]+$/.test(val), {
      message: 'É necessário fornecer um email ou um username válido.',
    }),
  password: z.string().min(6, 'A senha deve ter pelo menos 6 caracteres.'),
})

export type LoginInput = z.infer<typeof loginSchema>

export const loginResponseSchema = z.object({
  accessToken: z.string(),
})
