# Baseline and deploy migrations (P3005)

Your database already has tables, so Prisma needs migrations to be "baselined" before deploy.

## Steps

**1. Mark the first migration as already applied** (so Prisma skips it):

```bash
npx prisma migrate resolve --applied "20250221000000_remove_subject_category"
```

**2. Deploy remaining migrations** (adds `balanceDueDate` to Payment):

```bash
npx prisma migrate deploy
```

---

## If the first migration was never applied

If your `Subject` table still has a `category` column, run this once in your DB (e.g. Neon SQL editor), then do step 1 and 2 above:

```sql
ALTER TABLE "Subject" DROP COLUMN IF EXISTS "category";
```

---

## If you prefer to add only the new column by hand

Run in your database:

```sql
ALTER TABLE "Payment" ADD COLUMN IF NOT EXISTS "balanceDueDate" DATE;
```

Then mark both migrations as applied so Prisma’s history matches the DB:

```bash
npx prisma migrate resolve --applied "20250221000000_remove_subject_category"
npx prisma migrate resolve --applied "20250221100000_add_payment_balance_due_date"
```

After that, future `prisma migrate deploy` will only run new migrations.
