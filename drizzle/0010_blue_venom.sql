ALTER TABLE `sessions` ADD `isAsync` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `asyncExpiresAt` timestamp;