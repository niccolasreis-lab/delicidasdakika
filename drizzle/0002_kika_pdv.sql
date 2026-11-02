CREATE TABLE IF NOT EXISTS kika_stock (
 date TEXT NOT NULL, product_id TEXT NOT NULL, size TEXT NOT NULL CHECK(size IN ('P','M','G')),
 quantity INTEGER NOT NULL CHECK(quantity >= 0), version INTEGER NOT NULL DEFAULT 0,
 PRIMARY KEY(date,product_id,size)
);
CREATE TABLE IF NOT EXISTS kika_sale (
 order_id TEXT PRIMARY KEY NOT NULL REFERENCES orders(id), date TEXT NOT NULL,
 slot TEXT NOT NULL, source TEXT NOT NULL, method TEXT NOT NULL,
 payment_state TEXT NOT NULL, stock_returned INTEGER NOT NULL DEFAULT 0,
 revision INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS kika_sale_event (
 id INTEGER PRIMARY KEY AUTOINCREMENT, order_id TEXT NOT NULL,
 action TEXT NOT NULL, created_at TEXT NOT NULL
);
