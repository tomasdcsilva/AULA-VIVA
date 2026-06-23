ALTER TABLE `questions` MODIFY COLUMN `category` enum('stereotypes','control','consent','psychological_violence','healthy_relationships','jealousy','peer_pressure','social_media','masculinities','emotional_dependency') NOT NULL;--> statement-breakpoint
ALTER TABLE `questions` ADD `educationLevel` enum('2nd_cycle','3rd_cycle','secondary','all') DEFAULT 'all' NOT NULL;--> statement-breakpoint
ALTER TABLE `questions` ADD `isApproved` boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `questions` ADD `submittedBy` int;