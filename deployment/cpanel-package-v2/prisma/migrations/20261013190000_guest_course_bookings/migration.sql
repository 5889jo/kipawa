ALTER TABLE "Booking"
  ALTER COLUMN "userId" DROP NOT NULL,
  ADD COLUMN "email" TEXT,
  ADD COLUMN "phone" TEXT,
  ADD COLUMN "dateOfBirth" TIMESTAMP(3),
  ADD COLUMN "gender" TEXT,
  ADD COLUMN "nationality" TEXT,
  ADD COLUMN "address" TEXT,
  ADD COLUMN "educationLevel" TEXT;
