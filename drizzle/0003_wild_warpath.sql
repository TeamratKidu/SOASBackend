ALTER TABLE "auctions" RENAME COLUMN "image_urls" TO "imageUrls";--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "bio" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "tinNumber" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "faydaId" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "location" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "sellerApprovalStatus" text DEFAULT 'pending';