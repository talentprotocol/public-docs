// @ts-check
// `@type` JSDoc annotations allow editor autocompletion and type checking
// (when paired with `@ts-check`).
// There are various equivalent ways to declare your Docusaurus config.
// See: https://docusaurus.io/docs/api/docusaurus-config

import { themes as prismThemes } from "prism-react-renderer";
import { version } from "react";

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: "Talent Protocol Docs",
  tagline: "What's your Builder Score?",
  favicon: "img/favicon.ico",

  // Future flags, see https://docusaurus.io/docs/api/docusaurus-config#future
  future: {
    v4: true, // Improve compatibility with the upcoming Docusaurus v4
  },

  // Set the production url of your site here
  url: "https://docs2.talentprotocol.com",
  // Set the /<baseUrl>/ pathname under which your site is served
  // For GitHub pages deployment, it is often '/<projectName>/'
  baseUrl: "/",

  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: "talentprotocol", // Usually your GitHub org/user name.
  projectName: "public-docs", // Usually your repo name.
  deploymentBranch: "main", // The branch that GitHub pages will deploy from.
  trailingSlash: false,

  onBrokenLinks: "warn",
  onBrokenMarkdownLinks: "warn",

  // Even if you don't use internationalization, you can use this field to set
  // useful metadata like html lang. For example, if your site is Chinese, you
  // may want to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: "en",
    locales: ["en"],
  },

  plugins: [
    [
      "@docusaurus/plugin-content-pages",
      {
        path: "src/pages",
        routeBasePath: "",
        // include: ['**/*.{js,jsx,ts,tsx,md,mdx}'],
        // exclude: [
        //   '**/_*.{js,jsx,ts,tsx,md,mdx}',
        //   '**/_*/**',
        //   '**/*.test.{js,jsx,ts,tsx}',
        //   '**/__tests__/**',
        // ],
        // mdxPageComponent: '@theme/MDXPage',
        // remarkPlugins: [],
        // rehypePlugins: [],
        // beforeDefaultRemarkPlugins: [],
        // beforeDefaultRehypePlugins: [],
      },
    ],
    [
      "@docusaurus/plugin-content-docs",
      {
        path: "docs",
        breadcrumbs: true,
        routeBasePath: "/docs",
        sidebarPath: "./sidebars.js",
      },
    ],
    [
      "@docusaurus/plugin-sitemap",
      {
        lastmod: "date",
        changefreq: "weekly",
        priority: 0.5,
        ignorePatterns: ["/tags/**"],
        filename: "sitemap.xml",
      },
    ],
    [
      "@docusaurus/theme-classic",
      /** @type {import('@docusaurus/theme-classic').Options} */
      ({
        customCss: "./src/css/custom.css",
      }),
    ],
  ],

  // presets: [
  //   [
  //     'classic',
  //     /** @type {import('@docusaurus/preset-classic').Options} */
  //     ({
  //       docs: {
  //         sidebarPath: './sidebars.js',
  //         // Please change this to your repo.
  //         // Remove this to remove the "edit this page" links.
  //         //editUrl:
  //         //  'https://github.com/talentprotocol/public-docs/tree/main/packages/create-docusaurus/templates/shared/',
  //       },
  //       blog: {
  //         showReadingTime: true,
  //         feedOptions: {
  //           type: ['rss', 'atom'],
  //           xslt: true,
  //         },
  //         // Please change this to your repo.
  //         // Remove this to remove the "edit this page" links.
  //         //editUrl:
  //         //  'https://github.com/talentprotocol/public-docs/tree/main/packages/create-docusaurus/templates/shared/',
  //         // Useful options to enforce blogging best practices
  //         onInlineTags: 'warn',
  //         onInlineAuthors: 'warn',
  //         onUntruncatedBlogPosts: 'warn',
  //       },
  //       theme: {
  //         customCss: './src/css/custom.css',
  //       },
  //     }),
  //   ]
  // ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      // Replace with your project's social card
      image: "img/talent-protocol-og-image.jpg",
      // navbar: {
      //   title: 'Talent Protocol Docs',
      //   logo: {
      //     alt: 'Talent Protocol Logo',
      //     src: 'img/talent-protocol-logo.avif',
      //   },
      //   items: [
      //     {
      //       type: 'docSidebar',
      //       sidebarId: 'tutorialSidebar',
      //       position: 'left',
      //       label: 'Tutorial',
      //     },
      //     {to: '/blog', label: 'Blog', position: 'left'},
      //     {
      //       href: 'https://github.com/talentprotocol/public-docs',
      //       label: 'GitHub',
      //       position: 'right',
      //     },
      //   ],
      // },
      // footer: {
      //   style: 'dark',
      //   links: [
      //     {
      //       title: 'Community',
      //       items: [
      //         {
      //           label: 'Farcaster',
      //           href: 'https://warpcast.com/talent',
      //         },
      //         {
      //           label: 'X',
      //           href: 'https://x.com/TalentProtocol',
      //         },
      //         {
      //           label: 'Discord',
      //           href: 'https://discord.com/invite/talentprotocol',
      //         },
      //         {
      //           label: 'Telegram',
      //           href: 'https://t.me/talentprotocol',
      //         }
      //       ],
      //     },
      //     {
      //       title: 'More',
      //       items: [
      //         {
      //           label: 'App',
      //           to: '/app.talentprotocol.com',
      //         },
      //         {
      //           label: 'GitHub',
      //           href: 'https://github.com/talentprotocol/public-docs',
      //         },
      //       ],
      //     },
      //   ],
      //   copyright: `Copyright © 2020 - ${new Date().getFullYear()} Talent Protocol. Built with Docusaurus.`,
      // },
      prism: {
        theme: prismThemes.github,
        darkTheme: prismThemes.dracula,
        additionalLanguages: ["solidity", "ruby", "yaml", "bash"],
        defaultLanguage: "bash",
      },
      colorMode: {
        defaultMode: "dark",
        disableSwitch: false,
        respectPrefersColorScheme: true,
      },
      docs: {
        versionPersistence: "localStorage",
        sidebar: {
          hideable: true,
          autoCollapseCategories: true,
        },
      },
    }),
};

export default config;
