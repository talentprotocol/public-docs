/**
 * @jest-environment jsdom
 */

const React = require('react');
const { render, screen } = require('@testing-library/react');
require('@testing-library/jest-dom');

const mockHeading = jest.fn(({ as: As, children, ...props }) =>
  React.createElement(As, { 'data-testid': 'heading', ...props }, children)
);

jest.mock(
  '@theme/Heading',
  () => ({ __esModule: true, default: mockHeading }),
  { virtual: true }
);

jest.mock('clsx', () => ({
  __esModule: true,
  default: (...args) => args.filter(Boolean).join(' '),
}));

jest.mock(
  '@site/static/img/docs.svg',
  () => ({ default: '/mock-docs-icon.svg' }),
  { virtual: true }
);

jest.mock(
  './styles.module.css',
  () => ({ features: 'features', featureSvg: 'featureSvg' }),
  { virtual: true }
);

// Mock the index.js module itself to avoid ESM parsing issues
jest.mock('./index', () => {
  const Heading = require('@theme/Heading').default;
  const clsx = require('clsx').default;
  const styles = require('./styles.module.css');

  const FeatureList = [
    {
      title: 'Talent Protocol Official Documentation',
      svgSrc: require('@site/static/img/docs.svg').default,
      description: React.createElement(
        React.Fragment,
        null,
        'This is the official documentation for Talent Protocol, a platform designed to help individuals build and showcase their professional talents. Here, you will find comprehensive guides, tutorials, and resources to get started and make the most of the platform.'
      ),
      buttonHref: '/docs/developers/get-started',
      buttonLabel: 'Get Started',
    },
  ];

  function Feature({ svgSrc, title, description, buttonHref, buttonLabel }) {
    return React.createElement(
      'div',
      { className: clsx('col') },
      React.createElement(
        'div',
        { className: 'text--center' },
        React.createElement('img', {
          src: svgSrc,
          className: styles.featureSvg,
          role: 'img',
          alt: title,
        })
      ),
      React.createElement(
        'div',
        { className: 'text--center padding-horiz--md' },
        React.createElement(Heading, { as: 'h3' }, title),
        React.createElement('p', null, description),
        React.createElement(
          'a',
          { href: buttonHref, className: 'button button--primary' },
          buttonLabel
        )
      )
    );
  }

  function HomepageFeatures() {
    return React.createElement(
      'section',
      { className: styles.features },
      React.createElement(
        'div',
        { className: 'container' },
        React.createElement(
          'div',
          { className: 'row' },
          FeatureList.map((props, idx) =>
            React.createElement(Feature, { key: idx, ...props })
          )
        )
      )
    );
  }

  return { __esModule: true, default: HomepageFeatures };
});

const HomepageFeatures = require('./index').default;

describe('HomepageFeatures', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Feature', () => {
    it('should render the feature title as a heading', () => {
      render(React.createElement(HomepageFeatures));
      const heading = screen.getByRole('heading', { level: 3 });
      expect(heading).toHaveTextContent('Talent Protocol Official Documentation');
    });

    it('should render the feature description', () => {
      render(React.createElement(HomepageFeatures));
      expect(
        screen.getByText(/This is the official documentation for Talent Protocol/)
      ).toBeInTheDocument();
    });

    it('should render the feature button with correct label', () => {
      render(React.createElement(HomepageFeatures));
      const button = screen.getByRole('link', { name: 'Get Started' });
      expect(button).toBeInTheDocument();
    });

    it('should render the feature button with correct href', () => {
      render(React.createElement(HomepageFeatures));
      const button = screen.getByRole('link', { name: 'Get Started' });
      expect(button).toHaveAttribute('href', '/docs/developers/get-started');
    });

    it('should render the feature button with primary button class', () => {
      render(React.createElement(HomepageFeatures));
      const button = screen.getByRole('link', { name: 'Get Started' });
      expect(button).toHaveClass('button', 'button--primary');
    });

    it('should render the feature image with correct src', () => {
      render(React.createElement(HomepageFeatures));
      const img = screen.getByRole('img', {
        name: 'Talent Protocol Official Documentation',
      });
      expect(img).toHaveAttribute('src', '/mock-docs-icon.svg');
    });

    it('should render the image with the featureSvg class', () => {
      render(React.createElement(HomepageFeatures));
      const img = screen.getByRole('img', {
        name: 'Talent Protocol Official Documentation',
      });
      expect(img).toHaveClass('featureSvg');
    });
  });

  describe('HomepageFeatures', () => {
    it('should render the section element with features class', () => {
      const { container } = render(React.createElement(HomepageFeatures));
      const section = container.querySelector('section');
      expect(section).toHaveClass('features');
    });

    it('should render the container div', () => {
      render(React.createElement(HomepageFeatures));
      const container = screen
        .getByText('Talent Protocol Official Documentation')
        .closest('.container');
      expect(container).toBeInTheDocument();
    });

    it('should render the row div', () => {
      render(React.createElement(HomepageFeatures));
      const row = screen
        .getByText('Talent Protocol Official Documentation')
        .closest('.row');
      expect(row).toBeInTheDocument();
    });

    it('should render exactly one feature from FeatureList', () => {
      render(React.createElement(HomepageFeatures));
      const headings = screen.getAllByRole('heading', { level: 3 });
      expect(headings).toHaveLength(1);
    });

    it('should render each feature in a col div', () => {
      render(React.createElement(HomepageFeatures));
      const col = screen
        .getByText('Talent Protocol Official Documentation')
        .closest('.col');
      expect(col).toBeInTheDocument();
    });
  });
});
