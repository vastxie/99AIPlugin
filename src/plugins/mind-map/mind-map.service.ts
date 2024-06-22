import { Injectable } from '@nestjs/common';

@Injectable()
export class MindMapService {
  async execute(): Promise<string> {
    return 'Please provide a detailed outline in Markdown format: Use a multi-level structure with at least 3-4 levels. Include specific solutions or steps under each topic. Make it suitable for creating mind maps. Provide only the outline content without any irrelevant explanations. Start directly with the outline, no introduction needed. Use the language I asked in. Note: Use #, ##, ### etc. for different heading levels. Use - or * for list items. Use bold, italic etc. to emphasize key points. Use tables, code blocks etc. as needed. Please provide a clear, content-rich Markdown format outline based on these requirements.';
  }
}
