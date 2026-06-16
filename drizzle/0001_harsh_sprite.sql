CREATE TABLE `chat_messages` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`anonToken` varchar(64) NOT NULL,
	`content` text NOT NULL,
	`isHidden` boolean NOT NULL DEFAULT false,
	`isSensitive` boolean NOT NULL DEFAULT false,
	`isHighlighted` boolean NOT NULL DEFAULT false,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `chat_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `questions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`text` text NOT NULL,
	`type` enum('multiple_choice','scale','open') NOT NULL,
	`category` enum('stereotypes','control','consent','psychological_violence','healthy_relationships') NOT NULL,
	`sensitivityLevel` enum('low','medium','high') NOT NULL DEFAULT 'low',
	`options` text,
	`discipline` varchar(128),
	`yearGroup` varchar(32),
	`literaryWork` varchar(256),
	`isValidated` boolean NOT NULL DEFAULT false,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `questions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quizzes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(256) NOT NULL,
	`description` text,
	`literaryWork` varchar(256),
	`discipline` varchar(128),
	`yearGroup` varchar(32),
	`className` varchar(64),
	`showResultsImmediately` boolean NOT NULL DEFAULT false,
	`questionIds` text NOT NULL,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quizzes_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `session_responses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sessionId` int NOT NULL,
	`questionId` int NOT NULL,
	`anonToken` varchar(64) NOT NULL,
	`answer` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `session_responses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(16) NOT NULL,
	`quizId` int NOT NULL,
	`teacherId` int NOT NULL,
	`school` varchar(256),
	`status` enum('waiting','active','voting_closed','chat_open','closed') NOT NULL DEFAULT 'waiting',
	`chatEnabled` boolean NOT NULL DEFAULT false,
	`chatPaused` boolean NOT NULL DEFAULT false,
	`participantCount` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`closedAt` timestamp,
	CONSTRAINT `sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `sessions_code_unique` UNIQUE(`code`)
);
