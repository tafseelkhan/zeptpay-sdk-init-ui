// Hidden API call - developer cannot see/change URL
const BACKEND_URL = 'http://172.20.10.12:7000'; // Fixed URL - never exposed

export const verifyPublicKey = async (publicKey: string): Promise<{ valid: boolean; merchantData?: any }> => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/merchant/verify-public-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ publicKey }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw {
        response: {
          status: response.status,
          data
        }
      };
    }

    return data;
  } catch (error) {
    console.error('[ZeptPay] Public key verification failed');
    throw error;
  }
};