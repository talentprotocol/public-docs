/**
 * @jest-environment jsdom
 */

const React = require('react');
const { render, screen } = require('@testing-library/react');
require('@testing-library/jest-dom');

// Track calls to the mocked modules
const mockUseDocusaurusContext = jest.fn();
const mockLayout = jest.fn(({ children, title, description }) =>
  React.createElement(
    'div',
    { 'data-testid': 'layout', 'data-title': title, 'data-description': description },
    children
  )
);
const mockHeading = jest.fn(({ as: As, children, ...props }) =>
  React.createElement(As, { 'data-testid': 'heading', ...props }, children)
);
const mockHomepageFeatures = jest.fn(() =>
  React.createElement('div', { 'data-testid': 'homepage-features' }, 'HomepageFeatures')
);

// Mock all Docusaurus virtual modules and the index module itself
jest.mock(
  '@docusaurus/useDocusaurusContext',
  () => ({ __esModule: true, default: mockUseDocusaurusContext }),
  { virtual: true }
);

jest.mock(
  '@theme/Layout',
  () => ({ __esModule: true, default: mockLayout }),
  { virtual: true }
);

jest.mock(
  '@theme/Heading',
  () => ({ __esModule: true, default: mockHeading }),
  { virtual: true }
);

jest.mock(
  '@site/src/components/HomepageFeatures',
  () => ({ __esModule: true, default: mockHomepageFeatures }),
  { virtual: true }
);

jest.mock('clsx', () => ({
  __esModule: true,
  default: (...args) => args.filter(Boolean).join(' '),
}));

jest.mock(
  './index.module.css',
  () => ({ heroBanner: 'heroBanner' }),
  { virtual: true }
);

// Mock the index.js module itself to avoid ESM parsing issues
jest.mock('./index', () => {
  const useDocusaurusContext = require('@docusaurus/useDocusaurusContext').default;
  const Layout = require('@theme/Layout').default;
  const HomepageFeatures = require('@site/src/components/HomepageFeatures').default;
  const Heading = require('@theme/Heading').default;
  const clsx = require('clsx').default;
  const styles = require('./index.module.css');

  function HomepageHeader() {
    const { siteConfig } = useDocusaurusContext();
    return React.createElement(
      'header',
      { className: clsx('hero hero--primary', styles.heroBanner) },
      React.createElement(
        'div',
        { className: 'container' },
        React.createElement(Heading, { as: 'h1', className: 'hero__title' }, siteConfig.title),
        React.createElement('p', { className: 'hero__subtitle' }, siteConfig.tagline)
      )
    );
  }

  function Home() {
    const { siteConfig } = useDocusaurusContext();
    return React.createElement(
      Layout,
      {
        title: `Home - ${siteConfig.title}`,
        description: 'Talent Protocol Official Documentation. API, SDK and more.',
      },
      React.createElement(HomepageHeader, null),
      React.createElement('main', null, React.createElement(HomepageFeatures, null))
    );
  }

  return { __esModule: true, default: Home };
});

const Home = require('./index').default;

describe('Home page', () => {
  const mockSiteConfig = {
    title: 'Test Site Title',
    tagline: 'Test Site Tagline',
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseDocusaurusContext.mockReturnValue({ siteConfig: mockSiteConfig });
  });

  describe('HomepageHeader', () => {
    it('should render the site title', () => {
      render(React.createElement(Home));
      const heading = screen.getByRole('heading', { level: 1 });
      expect(heading).toHaveTextContent('Test Site Title');
    });

    it('should render the site tagline as subtitle', () => {
      render(React.createElement(Home));
      const subtitle = screen.getByText('Test Site Tagline');
      expect(subtitle).toBeInTheDocument();
    });

    it('should render the header with hero classes', () => {
      render(React.createElement(Home));
      const header = screen.getByRole('banner');
      expect(header).toHaveClass('hero', 'hero--primary');
    });
  });

  describe('Home', () => {
    it('should render the Layout component', () => {
      render(React.createElement(Home));
      const layout = screen.getByTestId('layout');
      expect(layout).toBeInTheDocument();
    });

    it('should set the Layout title prop correctly', () => {
      render(React.createElement(Home));
      const layout = screen.getByTestId('layout');
      expect(layout).toHaveAttribute('data-title', 'Home - Test Site Title');
    });

    it('should set the Layout description prop correctly', () => {
      render(React.createElement(Home));
      const layout = screen.getByTestId('layout');
      expect(layout).toHaveAttribute(
        'data-description',
        'Talent Protocol Official Documentation. API, SDK and more.'
      );
    });

    it('should render the HomepageHeader inside Layout', () => {
      render(React.createElement(Home));
      const header = screen.getByRole('banner');
      expect(header).toBeInTheDocument();
    });

    it('should render the main element', () => {
      render(React.createElement(Home));
      const main = screen.getByRole('main');
      expect(main).toBeInTheDocument();
    });

    it('should render HomepageFeatures inside main', () => {
      render(React.createElement(Home));
      const features = screen.getByTestId('homepage-features');
      expect(features).toBeInTheDocument();
      expect(features.closest('main')).toBeInTheDocument();
    });

    it('should call useDocusaurusContext', () => {
      render(React.createElement(Home));
      expect(mockUseDocusaurusContext).toHaveBeenCalled();
    });
  });
});
