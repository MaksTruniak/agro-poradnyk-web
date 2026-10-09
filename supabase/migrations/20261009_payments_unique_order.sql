-- Оплата: одне замовлення WayForPay — один платіж.
--
-- Було: callback перевіряв «чи є вже платіж із таким order_reference» і лише потім продовжував підписку;
-- база допускала два платежі з одним номером, тож два одночасні callback (WFP повторює їх) продовжили б
-- підписку двічі.
-- Стало: order_reference унікальний; callback спершу записує платіж і продовжує підписку, лише якщо запис вдався.

create unique index if not exists payments_order_reference_key on public.payments (order_reference);
