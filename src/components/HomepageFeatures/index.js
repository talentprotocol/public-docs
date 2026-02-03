import clsx from "clsx";
import Heading from "@theme/Heading";
import styles from "./styles.module.css";

const FeatureList = [
  {
    title: "Talent Official Documentation",
    svgSrc: require("@site/static/img/docs.svg").default,
    description: (
      <>
        This is the official documentation for Talent, a platform
        designed to help individuals build and showcase their professional
        talents. Here, you will find comprehensive guides, tutorials, and
        resources to get started and make the most of the platform.
      </>
    ),
    buttonHref: "/docs/get-started",
    buttonLabel: "Get Started",
  },
];

function Feature({ svgSrc, title, description, buttonHref, buttonLabel }) {
  return (
    <div className={clsx("col")}>
      <div className="text--center">
        <img
          src={svgSrc}
          className={styles.featureSvg}
          role="img"
          alt={title}
        />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
        <a href={buttonHref} className="button button--primary">
          {buttonLabel}
        </a>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
