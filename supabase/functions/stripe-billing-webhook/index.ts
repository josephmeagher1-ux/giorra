/**
 * Stripe Billing webhook handler for driver SEPA Direct Debit invoices.
 *
 * Configuration:
 *   - In the Stripe Dashboard, add the deployed URL of this function as a
 *     webhook endpoint and subscribe to the events listed below.
 *   - Set STRIPE_WEBHOOK_SECRET in Supabase secrets to the value Stripe
 *     gives you when you create the endpoint.
 *
 * Events handled:
 *   - invoice.payment_succeeded → mark all open FeeAccrual rows for that
 *     driver as settled, store the invoice id and amount.
 *   - invoice.payment_failed     → flag the mandate as 'failed' so the app
 *     prompts the driver to update their bank details.
 *   - customer.subscription.deleted → mark the mandate cancelled, stop
 *     accruing further fees.
 *
 * Stripe handles all retries, dunning, and SEPA-DD specifics. This function
 * only needs to keep Giorra's local accrual table in sync.
 */
import { serve } from 'https://deno.land/std@0.224.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@13?target=denonext';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY') ?? '';
const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') ?? '';
const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';

serve(async (req) => {
  if (!stripeSecret || !webhookSecret) {
    return new Response('Stripe billing not configured', { status: 503 });
  }
  const stripe = new Stripe(stripeSecret, { apiVersion: '2024-06-20' });
  const supabase = createClient(supabaseUrl, serviceKey);

  const signature = req.headers.get('stripe-signature') ?? '';
  const body = await req.text();
  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return new Response(`Bad signature: ${(err as Error).message}`, { status: 400 });
  }

  switch (event.type) {
    case 'invoice.payment_succeeded': {
      const invoice = event.data.object as Stripe.Invoice;
      const driverId = (invoice.metadata?.driver_id as string | undefined) ?? '';
      if (!driverId) break;
      await supabase
        .from('fee_accruals')
        .update({ settled_at: new Date().toISOString(), stripe_invoice_id: invoice.id })
        .is('settled_at', null)
        .is('voided_at', null)
        .eq('driver_id', driverId);
      break;
    }
    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice;
      const driverId = (invoice.metadata?.driver_id as string | undefined) ?? '';
      if (!driverId) break;
      await supabase
        .from('billing_mandates')
        .update({ status: 'failed' })
        .eq('driver_id', driverId);
      break;
    }
    case 'customer.subscription.deleted': {
      const sub = event.data.object as Stripe.Subscription;
      const driverId = (sub.metadata?.driver_id as string | undefined) ?? '';
      if (!driverId) break;
      await supabase
        .from('billing_mandates')
        .update({ status: 'cancelled' })
        .eq('driver_id', driverId);
      break;
    }
  }

  return new Response('ok', { status: 200 });
});
