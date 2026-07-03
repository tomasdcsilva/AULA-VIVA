ALTER TABLE `chat_messages` ADD `chatRoundId` int DEFAULT 1 NOT NULL;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD `chatRoundPrompt` text;--> statement-breakpoint
ALTER TABLE `sessions` ADD `chatCurrentRound` int DEFAULT 0 NOT NULL;