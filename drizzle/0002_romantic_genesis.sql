ALTER TABLE `questions` ADD `correctOption` int;--> statement-breakpoint
ALTER TABLE `session_responses` ADD `answeredAt` timestamp DEFAULT (now()) NOT NULL;--> statement-breakpoint
ALTER TABLE `session_responses` ADD `isCorrect` boolean;--> statement-breakpoint
ALTER TABLE `sessions` ADD `mode` enum('normal','kahoot') DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `activeQuestionIndex` int DEFAULT -1 NOT NULL;--> statement-breakpoint
ALTER TABLE `sessions` ADD `questionStartedAt` timestamp;--> statement-breakpoint
ALTER TABLE `sessions` ADD `questionDuration` int DEFAULT 20 NOT NULL;