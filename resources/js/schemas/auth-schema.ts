import { z } from 'zod';

// Login form validation schema
export const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
    remember: z.boolean().optional(),
});

export type LoginFormValues = z.infer<typeof loginSchema>;
