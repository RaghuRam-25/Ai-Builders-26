ALTER TABLE `chat_conversations` ADD CONSTRAINT `chat_conversations_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_conversationId_chat_conversations_id_fk` FOREIGN KEY (`conversationId`) REFERENCES `chat_conversations`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `chat_messages` ADD CONSTRAINT `chat_messages_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `citizen_profiles` ADD CONSTRAINT `citizen_profiles_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `service_notifications` ADD CONSTRAINT `service_notifications_userId_users_id_fk` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `chat_conversations_user_id_idx` ON `chat_conversations` (`userId`);--> statement-breakpoint
CREATE INDEX `chat_messages_conversation_id_idx` ON `chat_messages` (`conversationId`);--> statement-breakpoint
CREATE INDEX `chat_messages_user_id_idx` ON `chat_messages` (`userId`);--> statement-breakpoint
CREATE INDEX `service_notifications_user_id_idx` ON `service_notifications` (`userId`);--> statement-breakpoint
CREATE INDEX `service_notifications_user_read_idx` ON `service_notifications` (`userId`,`readAt`);