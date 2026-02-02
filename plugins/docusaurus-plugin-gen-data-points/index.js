// plugins/docusaurus-plugin-gen-data-points/index.js

const fs = require("fs");
const path = require("path");
const fetch = require("node-fetch"); // ensure this is installed in your project

module.exports = function genDataPointsPlugin(context, options) {
  return {
    name: "docusaurus-plugin-gen-data-points",

    extendCli(cli) {
      cli
        .command("gen-data-points-docs")
        .description(
          "Fetch Talent Protocol Data Points documentation generate .mdx docs"
        )
        .action(async () => {
          const outputDir = path.join(__dirname, "../../docs/data-points");
          if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
          }

          const requestOptions = {
            headers: {
              "Content-Type": "application/json",
              "User-Agent": "Docusaurus Data Points Generator",
              "X-API-KEY": process.env.TALENT_PROTOCOL_API_KEY || "",
            },
          };

          console.log("Fetching data...");
          const response = await fetch(
            "https://api.talentprotocol.com/data_issuers_meta",
            requestOptions
          );
          console.debug(`Response status: ${response.status}`);
          if (!response.ok) {
            console.error(
              `Failed to fetch data: ${response.status} ${response.statusText}`
            );
            return;
          }
          const data = await response.json();

          const dataIssuers = data.data_issuers;

          for (const dataIssuer of dataIssuers) {
            console.debug(
              `Processing data issuer: ${dataIssuer.name} (${dataIssuer.slug})`
            );
            const filePath = path.join(
              outputDir,
              `${dataIssuer.slug.replace("_", "-")}.mdx`
            );
            let content = `
# ${dataIssuer.name}

${dataIssuer.description || `${dataIssuer.name} data points`}

| Data Point Name | Description | Data Point Category |
|-----------------|-------------|---------------------|
`;
            for (const credential of dataIssuer.credentials) {
              content += `| ${credential.name} | ${credential.description} | <span className="badge badge--primary">${credential.category}</span> |\n`;
            }
            content += "\n";
            fs.writeFileSync(filePath, content);
            console.log(`Generated ${filePath}`);
          }

          // Generate index.mdx file
          const indexFilePath = path.join(outputDir, "index.mdx");
          const indexContent = `---
sidebar_position: 1
---

# Data Points

Explore data indexed by Talent at [https://talent.app/~/data](https://talent.app/~/data).
`;
          fs.writeFileSync(indexFilePath, indexContent);
          console.log(`Generated ${indexFilePath}`);

          console.log("✅ Generation complete!");
        });
      cli
        .command("clean-data-points-docs")
        .description(
          "Remove Talent Protocol Data Points documentation .mdx docs"
        )
        .action(() => {
          const outputDir = path.join(__dirname, "../../docs/data-points");
          if (fs.existsSync(outputDir)) {
            fs.readdirSync(outputDir).forEach((file) => {
              const filePath = path.join(outputDir, file);
              // Preserve index.mdx - don't delete it
              if (filePath.endsWith(".mdx") && file !== "index.mdx") {
                console.debug(`Removing file: ${filePath}`);
                // Remove the file
                fs.unlinkSync(filePath);
              }
            });
            console.log("✅ Cleaned data points documentation!");
          } else {
            console.log("No data points documentation to clean.");
          }
        });
    },
  };
};
