# Liability + income: what changes if Drivey takes money

This is not legal advice. The thresholds and rules below are sketched from
public Irish/EU guidance — get an Irish solicitor to review before you do
anything that involves taking fees.

## Three operating modes (pick one)

| Mode | What Drivey does with money | Income for you? | What you have to be |
| --- | --- | --- | --- |
| **A. Cost-share only, no fee** | Money flows rider → driver only; Drivey is just a notice board | None | An individual running an app. No special filings until users complain or you scale. |
| **B. Pass-through escrow, no fee** | Money sits briefly in Stripe Connect, settles to driver/charity. Drivey never holds funds | None | Likely registered as a sole trader/limited company because Stripe Connect needs a real entity. No VAT, no income tax on user money. |
| **C. Platform fee** | Drivey takes a percentage off each successful settlement | Yes | A real Irish business: sole trader or LTD, with all the obligations below. |

The escrow model you described maps to **Mode B** very naturally. You don’t need
fees to make it work. If you ever want fees later you can switch to **Mode C**
without redesigning the product.

## What you take on once money touches Drivey (Modes B and C)

Even without taking a fee:

- **Stripe Connect requires a real entity.** You can be an Irish sole trader
  with a TIN (PPSN) and a business bank account. Setup cost is ~€0. It’s the
  cheapest legal shell.
- **GDPR controller obligations** apply to all rider/driver data. You need a
  privacy policy and a controller record. No filings needed below ~250 staff.
- **EU Digital Services Act (DSA) “intermediary” classification.** As an
  online platform you have notice-and-action and transparency duties, but
  below 45M EU users the obligations are light.
- **Consumer protection law** kicks in once you mediate transactions: clear
  pre-contract info, refund/cancellation terms, dispute handling.
- **Anti-money-laundering** rules generally don’t apply because Stripe is the
  regulated entity holding funds, not you.

## What additional things kick in once you keep any of the money (Mode C)

- **Income tax** on Drivey’s fee revenue. Sole trader: file Form 11 yearly,
  pay income tax + USC + PRSI on net profit.
- **VAT registration threshold** in Ireland is €42,500 for services
  (2026 figure — confirm at the time). Below that you can choose not to
  register. Above it you must register and charge 23% VAT on your fees.
- **Platform-to-Business (P2B) regulation (EU 2019/1150)** if drivers are
  classed as “business users” — basically obliges you to publish terms,
  ranking explanations, complaint handling.
- **Stripe takes a transaction fee** (1.4% + €0.25 for EU cards) on the
  total, not just your cut. So your platform fee has to be high enough to
  absorb Stripe’s cost too.

## What stays the same in every mode

- The **insurance/SPSV story is about what the driver does**, not about what
  Drivey does. Even Mode A doesn’t shield the driver from insurance issues
  if they’re plying for hire. That’s why the dual-ceiling pricing and the
  cost-sharing framing matter regardless.
- **Defamation / content liability** is roughly the same in any mode — you
  host driver-written notes and ratings, so you need a takedown process.
- **Data subject access requests** apply identically.

## How to keep costs effectively zero while still being escrow-capable

- Register as a **sole trader** with Revenue (free, online via ROS).
- Open a **business current account** — most Irish banks have a fee-free year
  for sole traders.
- Use **Stripe Connect Standard or Express** with `capture_method=manual` to
  do authorize → capture. No platform fee = Stripe takes only its standard
  card processing fee from the rider; drivers receive net minus Stripe’s fee.
- **Donations** to charity flow as a separate Stripe charge to the charity’s
  own Stripe account (or transferred from your account if you’re acting as
  agent). Avoid having Drivey hold charitable funds.
- Don’t accept tips, donations to yourself, or anything that looks like
  revenue while you are still in Mode B.

## Adding a tiny platform fee (€0.05 / ride)

You can take a small fee and stay almost as light as Mode B. The mechanism:

- Use **Stripe Connect Standard** with `application_fee_amount=5` (cents).
- Rider pays the agreed cost-shared price. The fee comes out of the driver's
  payout, not on top — so the rider's payment never exceeds the ECC/PBC
  ceiling. The cost-sharing framing is preserved.
- Stripe splits the payment at source. You never hold rider funds. Stripe is
  the regulated payments party.
- No fee is charged on refunds (driver no-show) or charity donations (rider
  no-show). Drivey only earns when a real trip happens.

What this changes versus the no-fee Mode B:

- You now have **income**, so you need to file a yearly Form 11 with Revenue.
  At €0.05 × thousands of rides you'll be well under the VAT registration
  threshold (€42,500 services) and likely under the lower income-tax bands.
- You stay **below DSA "online platform" thresholds** that would otherwise
  add real obligations.
- You still don't have to provide refunds yourself — Stripe handles that.
- You still don't have to adjudicate disputes yourself — the escrow state
  machine + charity fallback does it structurally.

## Why setting up offshore probably won't help

Three pitfalls that catch almost everyone:

1. **Place of effective management.** Irish Revenue treats a foreign company
   that you run from Ireland as Irish tax-resident anyway. An Estonian OÜ or
   a Delaware LLC operated from your kitchen doesn't escape Irish tax.
2. **Consumer protection follows the user.** Brussels I-bis and Rome I make
   Irish consumer law apply to Irish users regardless of where Drivey is
   incorporated. You cannot opt out of refund rules, cancellation rights,
   or the EU online-dispute-resolution requirement by being foreign.
3. **GDPR and DSA apply to EU users.** Same story — incorporation doesn't
   change your obligations to data subjects or platform-user duties.

Offshore makes sense only when you live abroad, target users abroad, or hit
revenue scale where the structural tax-deferral pays for the doubled
compliance cost. €0.05 × Irish-only users isn't that.

## How to keep support obligations small

- **Self-service everything.** Refunds, cancellations, and donations all
  flow through the escrow state machine without human input.
- **Stripe handles chargebacks and card refunds.** You only see a webhook.
- **Best-effort SLA in your terms of service** (e.g. 5 business days,
  no guarantee of resolution). Have a solicitor review the ToS once.
- **Disputes route to the EU ODR portal and the Small Claims Court.** Linking
  the ODR portal in your app is an EU Reg 524/2013 requirement anyway, and
  Small Claims caps at €2,000 and €25 to file.
- **Don't promise anything in app copy.** Use "best-effort" language.

## What actually costs you time (and how to drop it to zero)

Tax filings take an evening once a year. The things that eat real time are:

1. **Refund disputes from riders** under Irish/EU consumer law
2. **Small Claims Court appearances**
3. **Tech-support tickets** ("my card didn’t go through")
4. **Trust & safety reports** between users
5. **GDPR subject access requests**

The legal lever that moves the needle most is *who is party to the
transaction*. The moment you’re party to a rider→driver payment, you inherit
all five. The moment you’re not, you’re an **"information society service"**
under the e-Commerce Directive, in the same legal bucket as a forum or a
classifieds site, and the safe harbours are very strong.

## Recommended phased rollout

### Phase 1 — Notice board (default in this codebase)

- Drivey lists trips, matches users, runs the rating + verification systems.
  **Drivey never touches money.** Riders and drivers settle in cash or Revolut.
- Charity fallback becomes a social commitment, not an escrow. The pickup
  confirmation flow still works; it just doesn’t move money.
- Your obligations: privacy policy, terms of service, takedown process.
  Tickets per month: roughly zero unless someone reports unsafe behaviour.
- Revenue: zero. That’s fine for the launch.

Enable with `EXPO_PUBLIC_MONEY_FLOW=notice_board` (the default).

### Phase 1.5 — Driver-paid post-trip success fee (recommended next step)

The cleanest way to generate revenue without taking on rider-facing
consumer liability. Drivey charges **the driver** — never the rider —
a small fixed fee per completed trip where the driver confirms in the
rating step that they actually received payment from the rider.

- **No money moves through Drivey on the rider→driver leg.** Rider pays
  driver in cash or Revolut as in Phase 1.
- **Driver is your customer, not the rider.** This single fact removes
  most of the consumer-law surface:
  - No 14-day cooling-off duty on the rider side
  - No ODR portal requirement on the rider side
  - No PCI scope for rider payments
  - No small-claims-court exposure from riders (no privity)
- **Prepaid Drivey wallet (default).**
  - **First 10 confirmed-paid trips are free** — new drivers prove the
    platform before paying anything. Onboarding lever, not a permanent
    discount.
  - After the trial, drivers top up €5/€10/€25 once via Stripe Checkout
    (card, Apple Pay, or Google Pay). Minimum top-up is **€5**.
  - **Loyalty bonus on larger packs** — top up €10 and get €10.25 credit
    (+5 free trips), top up €25 and get €26.00 credit (+20 free trips).
    The bonus equals exactly the Stripe fees Drivey saves by consolidating
    into one transaction, so the bigger pack is cost-neutral for Drivey
    versus the equivalent number of €5 top-ups while feeling like a
    psychological win for the driver.
  - Each confirmed-paid trip debits €0.05 from the wallet.
  - Optional opt-in auto top-up: when balance drops to **€0.20**, Drivey
    charges the saved card for the chosen pack. Off by default.
  - One Stripe transaction per top-up amortises card processing fees
    across ~200 trips for a €10 pack (~€0.002 of Stripe fee per trip).
  - No SEPA Direct Debit mandate, no recurring authorization, no IBAN.
  - Wallet balance is held in Drivey's Stripe customer balance, not in a
    Drivey-controlled bank account, so e-money licensing doesn't apply.
  - Driver psychology: prepaid mobile credit / coffee-shop card.
- **Alternative — SEPA Direct Debit** is also wired up for drivers who
  prefer it, but the default flow uses the wallet.
- **"Only if they actually got paid"** — built into the rating screen.
  Driver toggles "rider paid me yes/no". Yes → fee accrues. No → no fee,
  rider flagged on their profile.

What you owe drivers as their B2B customer:
- A clear price (€0.05/trip, no hidden charges)
- A way to dispute a wrongly-accrued fee (one button in the app)
- Accurate invoices

What you do **not** owe riders, ever:
- A refund (you sold them nothing)
- A response within X days (no contract)
- An ODR portal (you didn't sell them a digital service)

Code wiring:
- `packages/shared/src/billing/accrual.ts` — `FeeAccrual` model,
  `DRIVER_TRIP_FEE_EUR`, `summarise()`, `shouldInvoiceNow()`.
- `apps/mobile/lib/billing.ts` — in-memory accrual store, mirrors the
  Supabase shape.
- Rating screen asks the driver "Did the rider pay you?" and only accrues
  the fee on yes.
- `/subscription` screen shows the driver their outstanding tab.

### Phase 2 — Driver subscription via Stripe Billing

- Add a **€2/month driver subscription** for unlimited trip posting. Free
  tier remains for casual drivers with a monthly trip cap.
- Use **Stripe Billing** (not Connect). This is a B2B SaaS sale to drivers
  — recurring billing, dunning, and cancellations are handled by Stripe end
  to end. You only see webhook events.
- B2B drops most of the consumer-protection regime that hits B2C marketplaces.
  No 14-day cooling-off requirement for business buyers, lighter refund
  duties, no ODR portal requirement.
- Your obligations on top of Phase 1: file the income on Form 11. Done.

Enable with `EXPO_PUBLIC_DRIVER_SUBSCRIPTION=true` once Stripe Billing
products are created.

### Phase 3 — Optional escrow for drivers who want trust-and-safety

- Activate Stripe Connect with `application_fee_amount=5` (cents) only for
  drivers on the Pro tier. Standard-tier drivers stay on notice-board flow.
- You become a Stripe platform, but only for the subset of users who opt in.
- Charity-fallback escrow becomes a paid feature, not the default.

Enable with `EXPO_PUBLIC_MONEY_FLOW=stripe_escrow_with_fee`.

## Why this minimises ongoing time

| Phase | Refunds you handle | Court risk | Support tickets | Time per month |
| --- | --- | --- | --- | --- |
| 1 | None (no money) | None (not party) | Bug reports only | ~0 hours |
| 1.5 | None (B2B, Stripe Billing) | None from riders, very small from drivers | Disputed-fee toggles | ~10 minutes |
| 2 | None (Stripe handles) | None (B2B) | Subscription Qs | ~15 minutes |
| 3 | Stripe handles refunds; ODR for disputes | Small but possible | + escrow Qs | ~1 hour |

The point of Phase 1 isn’t to avoid making money forever — it’s to launch
without inheriting any of the obligations that would chew up your free time.
Once the platform proves out, Phase 2 is essentially "tick a Stripe product
into existence and toggle a flag".

## Recommended decision today

Default the codebase to **Phase 1 / notice-board mode** (already done).
Register as a sole trader so the Stripe Billing path is available when you
need it. Don’t accept money flowing through Drivey until you’re ready to
deal with the small support overhead of doing so. Re-evaluate offshore or
LTD structures only if revenue ever justifies it.
