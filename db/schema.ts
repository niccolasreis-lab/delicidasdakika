import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
export const orders = sqliteTable('orders', {
 id:text('id').primaryKey(), token:text('token').notNull(), requestHash:text('request_hash').notNull(), customer:text('customer').notNull(), phone:text('phone').notNull(), fulfillment:text('fulfillment').notNull(), address:text('address').notNull(), items:text('items').notNull(), total:integer('total').notNull(), fee:integer('fee').notNull(), status:text('status').notNull().default('recebido'), payment:text('payment').notNull().default('não cobrado'), createdAt:text('created_at').notNull()
});
