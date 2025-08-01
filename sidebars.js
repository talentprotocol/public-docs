// @ts-check

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.

 @type {import('@docusaurus/plugin-content-docs').SidebarsConfig}
 */
import apiSideBarItems from "./docs/developers/talent-api/api-reference/sidebar";

const sidebars = {
  // By default, Docusaurus generates a sidebar from the docs folder structure
  tutorialSidebar: [{ type: "autogenerated", dirName: "." }],

  // But you can create a sidebar manually

  // mySidebar: [
  //   "index",
  //   {
  //     type: "category",
  //     label: "Developers",
  //     items: [
  //       "developers/Get Started",
  //       {
  //         type: "category",
  //         label: "Talent API",
  //         link: {
  //           type: "doc",
  //           id: "developers/talent-api/index",
  //         },
  //         items: [
  //           "developers/talent-api/authentication",
  //           {
  //             type: "category",
  //             label: "API Reference - V2",
  //             link: {
  //               type: "doc",
  //               id: "developers/talent-api/api-reference/index",
  //             },
  //             items: apiSideBarItems,
  //           },
  //         ],
  //       },
  //     ],
  //   },
  // ],
};

export default sidebars;
