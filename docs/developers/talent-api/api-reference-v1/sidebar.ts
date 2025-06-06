import type { SidebarsConfig } from "@docusaurus/plugin-content-docs";

const sidebar: SidebarsConfig = {
  apisidebar: [
    {
      type: "doc",
      id: "developers/talent-api/api-reference-v1/api",
    },
    {
      type: "category",
      label: "Passport Credentials",
      items: [
        {
          type: "doc",
          id: "developers/talent-api/api-reference-v1/gets-the-credentials-of-a-passport",
          label: "Gets the credentials of a passport",
          className: "api-method get",
        },
      ],
    },
    {
      type: "category",
      label: "Passport Profiles",
      items: [
        {
          type: "doc",
          id: "developers/talent-api/api-reference-v1/updates-the-profile-of-a-passport",
          label: "Updates the profile of a passport",
          className: "api-method patch",
        },
      ],
    },
    {
      type: "category",
      label: "Passports",
      items: [
        {
          type: "doc",
          id: "developers/talent-api/api-reference-v1/get-a-list-of-passports-sorted-by-score",
          label: "Get a list of passports sorted by score",
          className: "api-method get",
        },
        {
          type: "doc",
          id: "developers/talent-api/api-reference-v1/get-a-passport-using-wallet-or-passport-id",
          label: "Get a passport using wallet or passport id",
          className: "api-method get",
        },
      ],
    },
  ],
};

export default sidebar.apisidebar;
