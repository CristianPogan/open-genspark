/**
 * Integration Tests for Presentation Generation
 * Tests end-to-end presentation creation flow without Google Drive
 */

describe('Presentation Integration Tests', () => {
  const API_URL = process.env.API_URL || 'http://localhost:3000';

  describe('Presentation Creation Flow', () => {
    it('should create presentation via API without Google Drive', async () => {
      const testPrompt = 'Create a 3-slide presentation about AI';
      
      const response = await fetch(`${API_URL}/api/superagent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: testPrompt,
          selectedTool: 'general',
          conversationHistory: []
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Should have response
      expect(data).toHaveProperty('response');
      
      // Should not require Google Drive
      expect(data.response).not.toContain('Google Drive');
      expect(data.response).not.toContain('sign in');
    });

    it('should generate slides using GENERATE_PRESENTATION_SLIDES tool', async () => {
      const testPrompt = 'Generate a presentation about machine learning with 5 slides';
      
      const response = await fetch(`${API_URL}/api/superagent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: testPrompt,
          selectedTool: 'slides',
          conversationHistory: []
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Should have slides or response
      expect(data).toHaveProperty('hasSlides');
      
      // If slides are generated, they should be in the response
      if (data.hasSlides && data.slides) {
        expect(Array.isArray(data.slides)).toBe(true);
        expect(data.slides.length).toBeGreaterThan(0);
      }
    });
  });

  describe('PPT Download', () => {
    it('should download PPT without requiring Google account', async () => {
      const mockSlides = [
        { title: 'Slide 1', content: 'Content 1', type: 'title' },
        { title: 'Slide 2', content: 'Content 2', type: 'content' }
      ];

      const response = await fetch(`${API_URL}/api/convert-to-ppt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slides: mockSlides,
          title: 'Test Presentation',
          style: 'professional'
        })
      });

      expect(response.status).toBe(200);
      expect(response.headers.get('content-type')).toContain('application/vnd.openxmlformats-officedocument.presentationml.presentation');
    });
  });

  describe('No Google Drive References', () => {
    it('should not include Google Drive tools in tool list', async () => {
      const response = await fetch(`${API_URL}/api/superagent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: 'What tools are available?',
          selectedTool: 'general',
          conversationHistory: []
        })
      });

      expect(response.status).toBe(200);
      const data = await response.json();
      
      // Response should not mention Google Drive
      if (data.response) {
        expect(data.response.toLowerCase()).not.toContain('google drive');
        expect(data.response.toLowerCase()).not.toContain('googledrive');
      }
    });
  });
});

