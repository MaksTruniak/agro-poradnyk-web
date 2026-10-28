-- Звірка @препаратів відповіді AI агронома з каталогом: скільки знайдено і скільки немає в каталозі.
-- Частка products_unknown показує, як часто модель називає препарати, яких немає в каталозі (вигадані чи незареєстровані).
alter table public.ai_requests add column if not exists products_found int;
alter table public.ai_requests add column if not exists products_unknown int;

-- Скільки з output_tokens припало на приховані міркування моделі (Claude: usage.output_tokens_details.thinking_tokens).
-- Уже входить в output_tokens і cost_usd — колонка лише показує, яку частку вартості відповіді з'їдають міркування.
alter table public.ai_requests add column if not exists thinking_tokens int;
