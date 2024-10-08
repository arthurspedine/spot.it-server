import z from 'zod'

export const createWallyRoleSchema = z.object({
  role: z.string().min(1, 'O nome do papel nao pode estar vazio.'),
  scoreMultiplier: z
    .number()
    .min(1, 'O multiplicador deve ter um valor maior ou igual a 1.'),
})

export type CreateWallyRoleInput = z.infer<typeof createWallyRoleSchema>

export const createWallySchema = z.object({
  name: z
    .string()
    .min(2, 'O nome deve ter pelo menos 2 caracteres.')
    .max(50, 'O nome deve ter no máximo 50 caracteres.'),
  email: z
    .string()
    .email('Formato de email inválido.')
    .max(100, 'O email deve ter no máximo 100 caracteres.'),
  profilePicture: z.string().min(1),
  role: z.string().min(1),
})

export type CreateWallyInput = z.infer<typeof createWallySchema>

export const getWallyDetailsSchema = z.object({
  id: z.string().min(1, 'Id nao pode estar vazio.'),
})

export type GetWallyDetailsParams = z.infer<typeof getWallyDetailsSchema>
