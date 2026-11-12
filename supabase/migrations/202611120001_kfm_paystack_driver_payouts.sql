-- KFM Paystack automated driver payouts (Preview-first).
-- Adds a tracked transfer lifecycle without changing existing wallet balances.
-- Test-mode transfers never mark a payout PAID or debit a driver wallet.

alter table public.kfm_driver_payouts
  add column if not exists paystack_recipient_code text,
  add column if not exists paystack_transfer_code text,
  add column if not exists paystack_transfer_reference text,
  add column if not exists paystack_transfer_status text not null default 'not_started',
  add column if not exists paystack_transfer_mode text,
  add column if not exists paystack_transfer_message text,
  add column if not exists paystack_transfer_attempted_at timestamptz,
  add column if not exists paystack_transfer_completed_at timestamptz;

create unique index if not exists kfm_driver_payouts_paystack_transfer_reference_uidx
  on public.kfm_driver_payouts(paystack_transfer_reference)
  where paystack_transfer_reference is not null;

alter table public.kfm_driver_payouts
  drop constraint if exists kfm_driver_payouts_paystack_transfer_status_check;
alter table public.kfm_driver_payouts
  add constraint kfm_driver_payouts_paystack_transfer_status_check
  check (paystack_transfer_status in (
    'not_started','initiating','pending','otp','success','failed','reversed','unknown','test_success'
  ));

-- A reversed Paystack transfer must restore the driver's wallet credit.
alter table public.kfm_wallet_transactions
  drop constraint if exists kfm_wallet_transactions_transaction_type_check;
alter table public.kfm_wallet_transactions
  add constraint kfm_wallet_transactions_transaction_type_check
  check (transaction_type in (
    'ride_driver_credit','ride_kfm_commission','ride_driver_reversal','ride_kfm_reversal',
    'cash_commission_debit','cash_commission_reversal','weekly_payout_debit','weekly_payout_reversal'
  ));

alter table public.kfm_driver_payouts
  drop constraint if exists kfm_driver_payouts_payout_status_check;
alter table public.kfm_driver_payouts
  add constraint kfm_driver_payouts_payout_status_check
  check (payout_status in ('pending','approved','paid','held','reversed'));

create or replace function public.kfm_handle_paystack_driver_payout_event(
  p_reference text,
  p_status text,
  p_transfer_code text,
  p_amount_pesewas bigint,
  p_currency text,
  p_domain text
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_payout public.kfm_driver_payouts%rowtype;
  v_admin_id uuid;
begin
  select * into v_payout
  from public.kfm_driver_payouts
  where paystack_transfer_reference = p_reference
  for update;

  if not found then
    raise exception 'KFM payout reference was not found.';
  end if;

  if upper(coalesce(p_currency,'')) <> 'GHS'
     or p_amount_pesewas is null
     or p_amount_pesewas <> round(v_payout.amount * 100)::bigint then
    raise exception 'Paystack transfer amount or currency does not match the approved payout.';
  end if;

  if p_status = 'success' then
    if p_domain = 'test' or v_payout.paystack_transfer_mode = 'test' then
      update public.kfm_driver_payouts
      set paystack_transfer_status='test_success',
          paystack_transfer_code=coalesce(p_transfer_code,paystack_transfer_code),
          paystack_transfer_message='Paystack test transfer succeeded; no real funds were sent.',
          paystack_transfer_completed_at=now()
      where id=v_payout.id;
      return jsonb_build_object('payout_id',v_payout.id,'status','test_success','paid',false);
    end if;

    if v_payout.payout_status <> 'approved' then
      raise exception 'Only an approved payout can be completed by Paystack.';
    end if;

    v_admin_id := coalesce(v_payout.reviewed_by, v_payout.created_at::text::uuid);
    update public.kfm_driver_payouts
      set paystack_transfer_status='success',
          paystack_transfer_code=coalesce(p_transfer_code,paystack_transfer_code),
          paystack_transfer_message='Paystack confirmed successful transfer.',
          paystack_transfer_completed_at=now()
      where id=v_payout.id;

    return public.kfm_mark_driver_payout_paid(
      v_payout.id,
      p_reference,
      coalesce(v_payout.reviewed_by, v_payout.created_by)
    );
  elsif p_status = 'failed' then
    update public.kfm_driver_payouts
    set paystack_transfer_status='failed',
        paystack_transfer_code=coalesce(p_transfer_code,paystack_transfer_code),
        paystack_transfer_message='Paystack reported that the transfer failed.',
        paystack_transfer_completed_at=now()
    where id=v_payout.id and payout_status='approved';
    return jsonb_build_object('payout_id',v_payout.id,'status','failed','paid',false);
  elsif p_status = 'reversed' then
    if v_payout.payout_status = 'paid' then
      insert into public.kfm_wallet_transactions(
        wallet_account_id,driver_id,payout_id,transaction_type,direction,amount,reference,description,metadata
      ) values (
        v_payout.wallet_account_id,v_payout.driver_id,v_payout.id,'weekly_payout_reversal','credit',v_payout.amount,
        'KFM-PAYOUT-REVERSAL-' || upper(replace(v_payout.id::text,'-','')),
        'Reversal of Paystack driver payout ' || p_reference,
        jsonb_build_object('paystack_reference',p_reference,'transfer_code',p_transfer_code)
      ) on conflict do nothing;

      update public.kfm_driver_payouts
      set payout_status='reversed',
          paystack_transfer_status='reversed',
          paystack_transfer_code=coalesce(p_transfer_code,paystack_transfer_code),
          paystack_transfer_message='Paystack reversed the transfer; wallet amount restored.',
          paystack_transfer_completed_at=now()
      where id=v_payout.id;
    else
      update public.kfm_driver_payouts
      set paystack_transfer_status='reversed',
          paystack_transfer_code=coalesce(p_transfer_code,paystack_transfer_code),
          paystack_transfer_message='Paystack reversed the transfer before payout completion.',
          paystack_transfer_completed_at=now()
      where id=v_payout.id;
    end if;
    return jsonb_build_object('payout_id',v_payout.id,'status','reversed','paid',false);
  end if;

  raise exception 'Unsupported Paystack transfer status.';
end;
$$;

revoke all on function public.kfm_handle_paystack_driver_payout_event(text,text,text,bigint,text,text) from public,anon,authenticated;
grant execute on function public.kfm_handle_paystack_driver_payout_event(text,text,text,bigint,text,text) to service_role;
