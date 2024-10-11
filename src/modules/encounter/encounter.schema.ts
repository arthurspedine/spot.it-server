import z from 'zod'

export const registerEncounterSchema = z.object({
  wallyId: z.string().min(1, 'Id do wally nao pode estar vazio'),
})

export type RegisterEncounterInput = z.infer<typeof registerEncounterSchema>
