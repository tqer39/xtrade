import { describe, expect, it } from 'vitest';
import { cleanHtml } from '../llm-scraper';

describe('llm-scraper', () => {
  describe('cleanHtml', () => {
    it('should remove script tags', () => {
      const html = '<html><script>alert("test")</script><body>content</body></html>';
      const result = cleanHtml(html);

      expect(result).not.toContain('<script>');
      expect(result).not.toContain('alert');
      expect(result).toContain('content');
    });

    it('should remove style tags', () => {
      const html = '<html><style>.class { color: red; }</style><body>content</body></html>';
      const result = cleanHtml(html);

      expect(result).not.toContain('<style>');
      expect(result).not.toContain('color: red');
      expect(result).toContain('content');
    });

    it('should remove HTML comments', () => {
      const html = '<html><!-- this is a comment --><body>content</body></html>';
      const result = cleanHtml(html);

      expect(result).not.toContain('<!--');
      expect(result).not.toContain('-->');
      expect(result).not.toContain('this is a comment');
      expect(result).toContain('content');
    });

    it('should collapse multiple whitespace', () => {
      const html = '<html><body>  content   with   spaces  </body></html>';
      const result = cleanHtml(html);

      expect(result).not.toContain('  ');
    });

    it('should remove whitespace between tags', () => {
      const html = '<div>  </div>  <span>  </span>';
      const result = cleanHtml(html);

      // >\s+< パターンにより全てのタグ間空白が削除される
      expect(result).toBe('<div></div><span></span>');
    });

    it('should handle nested script tags', () => {
      const html = `
        <html>
          <script type="text/javascript">
            function test() {
              return '<script>nested</script>';
            }
          </script>
          <body>content</body>
        </html>
      `;
      const result = cleanHtml(html);

      expect(result).not.toContain('function test');
      expect(result).toContain('content');
    });

    it('should handle empty input', () => {
      const result = cleanHtml('');
      expect(result).toBe('');
    });

    it('should trim result', () => {
      const html = '   <body>content</body>   ';
      const result = cleanHtml(html);

      expect(result).not.toMatch(/^\s/);
      expect(result).not.toMatch(/\s$/);
    });
  });
});
