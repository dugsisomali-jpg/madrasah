import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export async function generateNextUsername(prisma: any) {
  const users = await prisma.user.findMany({
    where: {
      username: {
        contains: '', // Find all
      },
    },
    select: { username: true },
  });

  const numericUsernames = users
    .map((u: any) => parseInt(u.username, 10))
    .filter((n: number) => !isNaN(n));

  const maxVal = numericUsernames.length > 0 ? Math.max(...numericUsernames) : 0;
  const nextVal = maxVal + 1;

  // Pad with zeros to at least 4 digits, but allow it to grow beyond that
  return String(nextVal).padStart(4, '0');
}
