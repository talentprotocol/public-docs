import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "doc",
      id: "developers/talent-api/api-reference-v2/api",
    },
    {
      type: "category",
      label: "Profiles, Advanced Search",
      items: [
        {
          type: "doc",
          id: "developers/talent-api/api-reference-v2/profiles-default-search-fields",
          label: "Profiles Default Search Fields",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "developers/talent-api/api-reference-v2/search-for-profiles",
          label: "Search for Profiles",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Accounts",
      items: [
        {
          type: "doc",
          id: "developers/talent-api/api-reference-v2/get-account-using-wallet-talent-id-or-account-identifier",
          label: "Get account using wallet, talent id or account identifier",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Credentials",
      items: [
        {
          type: "doc",
          id: "developers/talent-api/api-reference-v2/get-the-score-and-the-credentials-using-wallet-scorer-slug-talent-id-or-account-identifier",
          label: "Get the score and the credentials using wallet, scorer slug, talent id or account identifier",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Data Issuers Meta",
      items: [
        {
          type: "doc",
          id: "developers/talent-api/api-reference-v2/get-data-issuers-and-credentials-available",
          label: "Get data issuers and credentials available",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Data Points",
      items: [
        {
          type: "doc",
          id: "developers/talent-api/api-reference-v2/get-data-points-using-the-credential-slug-and-wallet-talent-id-or-account-identifier",
          label: "Get data points using the credential slug and wallet, talent id or account identifier",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Farcaster",
      items: [
        {
          type: "doc",
          id: "developers/talent-api/api-reference-v2/get-the-score-of-farcaster-accounts",
          label: "Get the score of farcaster accounts",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Human Checkmark",
      items: [
        {
          type: "doc",
          id: "developers/talent-api/api-reference-v2/get-talent-protocol-human-checkmark-using-wallet-talent-id-or-account-identifier",
          label: "Get Talent Protocol human checkmark using wallet, talent id or account identifier",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "developers/talent-api/api-reference-v2/get-talent-protocol-human-checkmark-data-points-using-wallet-talent-id-or-account-identifier",
          label: "Get Talent Protocol human checkmark data points using wallet, talent id or account identifier",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Profiles",
      items: [
        {
          type: "doc",
          id: "developers/talent-api/api-reference-v2/get-a-profile-using-wallet-talent-id-or-account-identifier",
          label: "Get a profile using wallet, talent id or account identifier",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Scores",
      items: [
        {
          type: "doc",
          id: "developers/talent-api/api-reference-v2/get-a-specific-score-using-wallet-scorer-slug-talent-id-or-account-identifier",
          label: "Get a specific score using wallet, scorer slug, talent id or account identifier",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Scorers Meta",
      items: [
        {
          type: "doc",
          id: "developers/talent-api/api-reference-v2/get-list-of-scorers",
          label: "Get list of scorers",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Socials",
      items: [
        {
          type: "doc",
          id: "developers/talent-api/api-reference-v2/get-socials-using-wallet-talent-id-or-account-identifier",
          label: "Get socials using wallet, talent id or account identifier",
          className: "api-method get",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;
