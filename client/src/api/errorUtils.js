export const getApiErrorCode = (error) => {
  if (typeof error?.code === 'string' && error.code.trim()) {
    return error.code;
  }

  const payloadCode = error?.payload?.error?.code || error?.payload?.code;
  if (typeof payloadCode === 'string' && payloadCode.trim()) {
    return payloadCode;
  }

  return null;
};

export const isApiErrorCode = (error, expectedCode) =>
  Boolean(expectedCode) && getApiErrorCode(error) === expectedCode;
