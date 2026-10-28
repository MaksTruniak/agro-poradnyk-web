-- Звірка @препаратів відповіді AI агронома з каталогом: скільки знайдено і скільки немає в каталозі.
-- Частка products_unknown показує, як часто модель називає препарати, яких немає в каталозі (вигадані чи незареєстровані).
alter table public.ai_requests add column if not exists products_found int;
alter table public.ai_requests add column if not exists products_unknown int;
