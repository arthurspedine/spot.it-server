import z from 'zod'

export const registerEncounterSchema = z.object({
  wallyId: z.string().min(1, 'Id do wally nao pode estar vazio'),
  encounterImage: z.string().min(1, 'Imagem nao pode estar vazia'),
})

export type RegisterEncounterInput = z.infer<typeof registerEncounterSchema>
