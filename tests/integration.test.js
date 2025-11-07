const axios = require('axios');
const cheerio = require('cheerio');
const { sampleHtmlWithYale } = require('./test-utils');
const nock = require('nock');
const app = require('../app');

// Set a different port for testing to avoid conflict with the main app
const TEST_PORT = 3099;
let server;

describe('Integration Tests', () => {
  beforeAll(() => {
    // Block all real network calls...
    nock.disableNetConnect();
    // ...except to our local test server (localhost / 127.0.0.1)
    nock.enableNetConnect((host) =>
      host.includes('localhost') || host.includes('127.0.0.1')
    );
  });

  afterAll(() => {
    nock.cleanAll();
    nock.enableNetConnect(); // restore default behavior
  });

  beforeAll((done) => {
    server = app.listen(TEST_PORT, done);
  });

  afterAll((done) => {
    server.close(done);
  });

  test('Should replace Yale with Fale in fetched content', async () => {
    // Setup mock for example.com
    nock('https://example.com')
      .get('/')
      .reply(200, sampleHtmlWithYale, { 'Content-Type': 'text/html' });
    
    // Make a request to our proxy app
    const response = await axios.post(`http://localhost:${TEST_PORT}/fetch`, {
      url: 'https://example.com/'
    });
    
    expect(response.status).toBe(200);
    expect(response.data.success).toBe(true);
    
    // Verify Yale has been replaced with Fale in text
    const $ = cheerio.load(response.data.content);
    expect($('title').text()).toBe('Fale University Test Page');
    expect($('h1').text()).toBe('Welcome to Fale University');
    expect($('p').first().text()).toContain('Fale University is a private');
    
    // Verify URLs remain unchanged
    const links = $('a');
    let hasYaleUrl = false;
    links.each((i, link) => {
      const href = $(link).attr('href');
      if (href && href.includes('yale.edu')) {
        hasYaleUrl = true;
      }
    });
    expect(hasYaleUrl).toBe(true);
    
    // Verify link text is changed
    expect($('a').first().text()).toBe('About Fale');
  });

  test('Should handle invalid URLs', async () => {
    try {
      await axios.post(`http://localhost:${TEST_PORT}/fetch`, {
        url: 'ht!tp://bad'
      });
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.error).toBe('Invalid URL');
    }
  });

  test('Should handle missing URL parameter', async () => {
    try {
      await axios.post(`http://localhost:${TEST_PORT}/fetch`, {});
      // Should not reach here
      expect(true).toBe(false);
    } catch (error) {
      expect(error.response.status).toBe(400);
      expect(error.response.data.error).toBe('URL is required');
    }
  });
});
