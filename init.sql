-- Таблица компаний
CREATE TABLE IF NOT EXISTS companies (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL
);
-- Добавляем две компании
INSERT INTO companies (name) VALUES ('Графит'), ('Гиредмет');
-- В таблицу cartridges добавляем колонку company_id
ALTER TABLE cartridges ADD COLUMN IF NOT EXISTS company_id INTEGER REFERENCES companies(id);
-- Для существующих записей (если они есть) проставляем company_id = 1 (по умолчанию)
UPDATE cartridges SET company_id = 1 WHERE company_id IS NULL;
ALTER TABLE cartridges ALTER COLUMN company_id SET NOT NULL;
