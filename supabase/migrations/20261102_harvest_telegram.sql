-- Telegram-бот для збирачів врожаю: збирач підключає чат без пароля (посилання/QR від фермера або з кабінету),
-- отримує свій QR, повідомлення про кожне зважування й виплату, підсумки за день і сезон, підтверджує виплату кнопкою.
--
-- tg_notified_at — коли збирачу надіслано повідомлення про цей запис: сервер ставить його атомарно,
-- тож повторний виклик (подвійний клік, повтор запиту) не надішле повідомлення вдруге.

begin;

alter table public.harvest_records add column if not exists tg_notified_at timestamptz;
alter table public.harvest_payments add column if not exists tg_notified_at timestamptz;

commit;
