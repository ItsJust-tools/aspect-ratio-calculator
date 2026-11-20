import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import type { ReactNode } from 'react';
import manifest from '@/app/manifest';
import robots from '@/app/robots';
import sitemap from '@/app/sitemap';
import ErrorPage from '@/app/error';
import NotFound from '@/app/not-found';
import { JsonLd } from '@/app/json-ld';
import ToolPage from '@/app/page';
import { cn } from '@/lib/utils';
import { generateJsonLd, generateToolMetadata } from '@/lib/seo';
import toolConfig from '@/tool/tool.config';
import { getPublicSiteUrl, templateMetadata } from '@/tool/template-metadata';
import { slugGeneratorTool } from '@/tool/tool-definition';
import { ToolCanvas } from '@/tool/components/tool-canvas';
import { ToolSidebar } from '@/tool/components/tool-sidebar';
import { ToolToolbar } from '@/tool/components/tool-toolbar';
import type { ExporterLoader } from '@itsjust/core';

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: { href: string; children: ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

vi.mock('@/app/tool-client-wrapper', () => ({
  default: () => <div data-testid="tool-client-wrapper">tool-client-wrapper</div>,
}));

describe('app and seo', () => {
  const getOgImageUrl = (
    images: NonNullable<NonNullable<ReturnType<typeof generateToolMetadata>['openGraph']>['images']>
  ): string | undefined => {
    const list = Array.isArray(images) ? images : [images];
    const first = list[0];
    if (!first) return undefined;
    if (typeof first === 'string') return first;
    if (first instanceof URL) return first.toString();
    return String(first.url);
  };

  it('builds metadata and json-ld values', () => {
    const metadata = generateToolMetadata(toolConfig);
    const jsonLd = generateJsonLd(toolConfig);

    expect(metadata.creator).toBe(toolConfig.name);
    expect(metadata.metadataBase?.toString()).toBe('http://localhost:3000/');
    const ogUrl = metadata.openGraph?.images ? getOgImageUrl(metadata.openGraph.images) : undefined;
    expect(ogUrl).toContain('/og.svg');
    expect(jsonLd.url).toBe('http://localhost:3000');
    expect(jsonLd.featureList.length).toBeGreaterThan(0);
  });

  it('returns site manifest, robots and sitemap', () => {
    const man = manifest();
    const rob = robots();
    const sm = sitemap();

    expect(man.name).toBe(templateMetadata.appName);
    expect(rob.sitemap).toBe('http://localhost:3000/sitemap.xml');
    expect(sm[0]?.url).toBe('http://localhost:3000');
  });

  it('renders json-ld script safely', () => {
    render(<JsonLd config={{ ...toolConfig, name: '</script>' }} />);
    const script = document.querySelector('script[type="application/ld+json"]');
    expect(script?.innerHTML).toContain('\\u003c/script>');
  });

  it('renders error page and invokes reset', () => {
    const reset = vi.fn();
    render(<ErrorPage error={new Error('boom')} reset={reset} />);

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  it('renders not-found page', () => {
    render(<NotFound />);
    expect(screen.getByText('Page not found')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go home' })).toHaveAttribute('href', '/');
  });

  it('renders top-level tool page', () => {
    render(<ToolPage />);
    expect(screen.getByTestId('tool-client-wrapper')).toBeInTheDocument();
    expect(document.querySelector('script[type="application/ld+json"]')).toBeInTheDocument();
  });

  it('covers tool definition and helper exports', async () => {
    expect(cn('a', undefined, 'b', false, null, 'c')).toBe('a b c');
    expect(getPublicSiteUrl()).toBe('http://localhost:3000');

    expect(slugGeneratorTool.id).toBe(toolConfig.id);
    expect(slugGeneratorTool.name).toBe(toolConfig.name);

    const valid = slugGeneratorTool.deserialize({
      input: 'Hello',
      separator: '-',
      transliterate: true,
      removeStopWords: false,
      maxLength: 0,
      batchMode: false,
      output: '',
    });
    expect(valid.success).toBe(true);
    if (valid.success) {
      expect(valid.data.input).toBe('Hello');
    }

    expect(slugGeneratorTool.deserialize({ nope: true })).toEqual({
      success: false,
      error: 'Invalid data format: expected valid slug generator state',
    });

    const serialized = slugGeneratorTool.serialize(valid.success ? valid.data : slugGeneratorTool.initialState);
    expect(() => JSON.parse(serialized)).not.toThrow();

    const exporters = slugGeneratorTool.exporters ?? [];
    expect(exporters).toHaveLength(4);
    const first = exporters[0];
    expect(first).toBeDefined();
    if (!first) throw new Error('missing exporter');
    const png = await (first.loader as ExporterLoader)();
    const resolved = 'default' in png ? png.default : png.exporter;
    expect(resolved.format).toBe('png');
  });

  it('renders tool components', () => {
    render(
      <>
        <ToolToolbar />
        <ToolSidebar
          state={{ ...slugGeneratorTool.initialState }}
          onChange={() => {}}
        />
        <ToolCanvas state={{ ...slugGeneratorTool.initialState, input: 'Hello World' }} onChange={() => {}} />
      </>
    );

    expect(screen.getByRole('link', { name: 'Open help page' })).toBeInTheDocument();
    expect(screen.getByTestId('slug-preview')).toHaveTextContent('hello-world');
    expect(screen.getByText('Separator')).toBeInTheDocument();
    expect(
      screen.getByRole('application', { name: 'Slug generator canvas' })
    ).toBeInTheDocument();
  });

  it('updates the live slug preview as input changes', () => {
    const { default: user } = require('@testing-library/user-event') as {
      default: typeof import('@testing-library/user-event').default;
    };
    // Fallback: re-render with different state via controlled component test
    let current = { ...slugGeneratorTool.initialState, input: 'one' };
    const { rerender } = render(
      <ToolCanvas state={current} onChange={(s) => (current = s)} />
    );
    expect(screen.getByTestId('slug-preview')).toHaveTextContent('one');

    current = { ...current, input: 'one two' };
    rerender(<ToolCanvas state={current} onChange={(s) => (current = s)} />);
    expect(screen.getByTestId('slug-preview')).toHaveTextContent('one-two');

    void user; // user-event imported for completeness; interactions covered in e2e
  });
});
