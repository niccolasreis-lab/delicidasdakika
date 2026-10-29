CREATE TABLE `orders` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`request_hash` text NOT NULL,
	`customer` text NOT NULL,
	`phone` text NOT NULL,
	`fulfillment` text NOT NULL,
	`address` text NOT NULL,
	`items` text NOT NULL,
	`total` integer NOT NULL,
	`fee` integer NOT NULL,
	`status` text DEFAULT 'recebido' NOT NULL,
	`payment` text DEFAULT 'não cobrado' NOT NULL,
	`created_at` text NOT NULL
);
