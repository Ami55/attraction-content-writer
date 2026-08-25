import { Request, Response, Router } from 'express';
import { 
  processSingleAttraction, 
  researchAttraction, 
  generateAttractionDescription, 
  qualityCheckAndRevise,
  chatAndRefineAttractionDescription 
} from './geminiService.js';

export const apiRouter = Router();

// Test connection endpoint
apiRouter.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

apiRouter.get('/test-connection', (req: Request, res: Response) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({
    status: 'ok',
    apiKeyConfigured: hasKey,
    timestamp: new Date().toISOString(),
  });
});

// Single attraction processing
apiRouter.post('/process-attraction', async (req: Request, res: Response) => {
  try {
    const {
      attraction_name,
      city,
      country,
      attraction_url,
      notes,
      additional_instructions,
      existing_descriptions,
      regenerate_mode,
      custom_instruction,
      existing_research,
    } = req.body;

    if (!attraction_name || typeof attraction_name !== 'string' || !attraction_name.trim()) {
      return res.status(400).json({ error: 'attraction_name is required' });
    }

    const result = await processSingleAttraction({
      attraction_name: attraction_name.trim(),
      city: city?.trim(),
      country: country?.trim(),
      attraction_url: attraction_url?.trim(),
      notes: notes?.trim(),
      additional_instructions,
      existing_descriptions,
      regenerate_mode,
      custom_instruction,
      existing_research,
    });

    res.json(result);
  } catch (error: any) {
    console.error('API /process-attraction error:', error);
    res.status(500).json({
      status: 'failed',
      error_message: error.message || 'Internal server error while processing attraction',
    });
  }
});

// Research only endpoint
apiRouter.post('/research-only', async (req: Request, res: Response) => {
  try {
    const { attraction_name, city, country, attraction_url, notes } = req.body;
    if (!attraction_name) {
      return res.status(400).json({ error: 'attraction_name is required' });
    }

    const result = await researchAttraction({
      attraction_name,
      city,
      country,
      attraction_url,
      notes,
    });

    res.json(result);
  } catch (error: any) {
    console.error('API /research-only error:', error);
    res.status(500).json({ error: error.message || 'Failed to research attraction' });
  }
});

// Audit / Quality check endpoint for manual edits
apiRouter.post('/quality-check', async (req: Request, res: Response) => {
  try {
    const { content, attraction_name, city, country } = req.body;
    if (!content || !attraction_name) {
      return res.status(400).json({ error: 'content and attraction_name are required' });
    }

    const verified = await qualityCheckAndRevise(content, attraction_name, city, country);
    res.json(verified);
  } catch (error: any) {
    console.error('API /quality-check error:', error);
    res.status(500).json({ error: error.message || 'Failed to run quality check' });
  }
});

// Interactive Chat & Refine endpoint
apiRouter.post('/refine-chat', async (req: Request, res: Response) => {
  try {
    const {
      attraction_name,
      city,
      country,
      current_heading,
      current_content,
      user_prompt,
      chat_history,
      research,
      additional_instructions,
    } = req.body;

    if (!attraction_name || !user_prompt) {
      return res.status(400).json({ error: 'attraction_name and user_prompt are required' });
    }

    const result = await chatAndRefineAttractionDescription({
      attraction_name,
      city,
      country,
      current_heading: current_heading || `See the best of ${attraction_name} with a private guide`,
      current_content: current_content || '',
      user_prompt,
      chat_history,
      research,
      additional_instructions,
    });

    res.json(result);
  } catch (error: any) {
    console.error('API /refine-chat error:', error);
    res.status(500).json({ error: error.message || 'Failed to refine copy with AI assistant' });
  }
});
