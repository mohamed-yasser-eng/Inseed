import { IFailedResponse, ISuccessResponse } from '../../Common'

export function SuccessResponse<T>(message = 'request is processed successfully', status = 200, data?: T): ISuccessResponse {
  return {
    meta: {
      status,
      success: true,
    },
    data: {
      message,
      data,
    },
  }
}

export function FailedResponse(message = 'request processing failed', status = 500, error?: object): IFailedResponse {
  return {
    meta: {
      status,
      success: false,
    },
    error: {
      message,
      context: error,
    },
  }
}
