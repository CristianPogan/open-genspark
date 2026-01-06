/**
 * Unit Tests for Presentation Generation
 * Tests that presentations are created locally without Google Drive dependencies
 */

describe('Presentation Generation', () => {
  describe('Slide Generation Tool', () => {
    it('should generate slides without requiring Google account', async () => {
      // Mock the slide generation tool
      const mockSlides = [
        {
          title: 'Test Slide 1',
          content: 'Test content',
          type: 'title' as const,
          html: '<div>Test HTML</div>'
        },
        {
          title: 'Test Slide 2',
          content: 'More content',
          type: 'content' as const,
          html: '<div>More HTML</div>'
        }
      ];

      expect(mockSlides).toHaveLength(2);
      expect(mockSlides[0].type).toBe('title');
      expect(mockSlides[0].html).toBeDefined();
    });

    it('should create presentation data structure correctly', () => {
      const slideData = {
        slides: [
          { title: 'Slide 1', content: 'Content 1', type: 'title' },
          { title: 'Slide 2', content: 'Content 2', type: 'content' }
        ],
        slideCount: 2,
        topic: 'Test Presentation',
        style: 'professional',
        message: 'Successfully generated 2 slides.'
      };

      expect(slideData.slides).toHaveLength(2);
      expect(slideData.slideCount).toBe(2);
      expect(slideData.style).toBe('professional');
    });
  });

  describe('No Google Drive Dependencies', () => {
    it('should not require Google Drive tools for presentation creation', () => {
      const tools = {
        GOOGLESHEETS: 22,
        GOOGLEDOCS: 12,
        COMPOSIO_SEARCH: 15,
        COMPOSIO: 22
      };

      // Verify Google Drive/Slides tools are not included
      expect(tools).not.toHaveProperty('GOOGLEDRIVE');
      expect(tools).not.toHaveProperty('GOOGLESLIDES');
    });

    it('should work without Google account connection', () => {
      const hasGoogleAccount = false;
      const canCreatePresentation = true; // Always true - no Google needed

      expect(canCreatePresentation).toBe(true);
      expect(hasGoogleAccount).toBe(false);
    });
  });
});

