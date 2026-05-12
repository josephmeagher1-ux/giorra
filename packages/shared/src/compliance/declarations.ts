/**
 * Driver declarations and copy that must be displayed before a driver can
 * post a trip. Stored alongside the user profile so we have an audit trail
 * if regulators or insurers ever ask.
 */
export const DRIVER_DECLARATIONS = {
  version: '2026-05-1',
  required_at_first_post: [
    {
      id: 'private_policy',
      text:
        "I confirm that my vehicle is privately insured and my policy does not exclude carpooling. Drivey is a cost-sharing platform — I am not operating as a passenger transport business.",
    },
    {
      id: 'not_for_hire',
      text:
        "I will not advertise, ply for hire, or accept payments above the calculated cost-sharing maximum. Contributions only cover real running costs of the trip.",
    },
    {
      id: 'pre_arranged',
      text:
        "All trips are pre-arranged before the journey begins. Drivey will not enable street-hail or on-the-fly hiring.",
    },
    {
      id: 'capacity',
      text:
        "My vehicle is not built or adapted to carry more than 8 passengers (excluding the driver) and I will keep within the seat-belt fitted capacity.",
    },
  ],
  rider_acknowledgement: [
    {
      id: 'cost_share',
      text:
        "I understand Drivey is a cost-sharing platform. The driver pays their own share too, and my contribution is capped at calculated cost.",
    },
  ],
} as const;
