import httpStatus from 'http-status';
import asyncHandler from '../../lib/asyncHandler';
import sendResponse from '../../lib/sendResponse';
import { askCopilotService } from './ai.services';

class AIControllers {
  askCopilot = asyncHandler(async (req, res) => {
    const { message, history } = req.body;
    const userId = req.user._id;

    const result = await askCopilotService({
      message: message || '',
      userId,
      history: history || []
    });

    sendResponse(res, {
      success: true,
      statusCode: httpStatus.OK,
      message: 'AI Copilot response generated successfully!',
      data: result
    });
  });
}

const aiControllers = new AIControllers();
export default aiControllers;
