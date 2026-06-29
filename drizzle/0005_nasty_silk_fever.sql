ALTER TABLE `quizzes` ADD `excerpt` text;--> statement-breakpoint
ALTER TABLE `quizzes` ADD `theme` varchar(128);--> statement-breakpoint
ALTER TABLE `sessions` ADD `className` varchar(64);--> statement-breakpoint
ALTER TABLE `sessions` ADD `sessionDate` timestamp;