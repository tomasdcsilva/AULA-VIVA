ALTER TABLE `users` ADD `passwordHash` varchar(256);--> statement-breakpoint
ALTER TABLE `users` ADD `emailVerified` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `verificationToken` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `verificationTokenExpiresAt` timestamp;--> statement-breakpoint
ALTER TABLE `users` ADD `resetToken` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD `resetTokenExpiresAt` timestamp;