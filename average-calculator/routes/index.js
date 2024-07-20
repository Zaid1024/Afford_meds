const express = require('express');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;
const MAX_WINDOW_SIZE = 10;
const NUMBERS_API_ENDPOINT = 'http://api.20.244.56.144/numbers'; // Replace with the actual URL

let numberWindow = [];
let uniqueNumberSet = new Set();

const userCredentials = {
  companyName: "Zmart",
  clientID: "f0192bf6-4d86-4c9c-b5f1-9714d21a08b9",
  clientSecret: "WsSBeEntevBaaMHm",
  ownerName: "ZaidH",
  ownerEmail: "zaidhussain088@gmail.com",
  rollNo: "02JST22UCS411"
};

const authToken = {
  token_type: "Bearer",
  access_token: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJNYXBDbGFpbXMiOnsiZXhwIjoxNzIxNDU0OTkzLCJpYXQiOjE3MjE0NTQ2OTMsImlzcyI6IkFmZm9yZG1lZCIsImp0aSI6ImYwMTkyYmY2LTRkODYtNGM5Yy1iNWYxLTk3MTRkMjFhMDhiOSIsInN1YiI6InphaWRodXNzYWluMDg4QGdtYWlsLmNvbSJ9LCJjb21wYW55TmFtZSI6IlptYXJ0IiwiY2xpZW50SUQiOiJmMDE5MmJmNi00ZDg2LTRjOWMtYjVmMS05NzE0ZDIxYTA4YjkiLCJjbGllbnRTZWNyZXQiOiJXc1NCZUVudGV2QmFhTUhtIiwib3duZXJOYW1lIjoiWmFpZEgiLCJvd25lckVtYWlsIjoiemFpZGh1c3NhaW4wODhAZ21haWwuY29tIiwicm9sbE5vIjoiMDJKU1QyMlVDUzQxMSJ9.9kwmAxXdjpFdVYV3D5wEgDMgOANPO_SyW4WNNU9AOOI",
  expires_in: 1721454993
};

app.get('/numbers/:numberid', async (req, res) => {
  const { numberid } = req.params;
  if (!['p', 'f', 'e', 'r'].includes(numberid)) {
    return res.status(400).json({ error: 'Invalid numberid' });
  }

  const startTime = Date.now();
  const apiResponse = await fetchNumbersFromApi(numberid);
  if (!apiResponse) {
    console.error('Failed to fetch numbers from API');
    return res.status(500).json({ error: 'Failed to fetch numbers' });
  }

  console.log('API Response:', apiResponse);

  const numbersArray = apiResponse.numbers;
  const filteredNumbers = numbersArray.filter(num => !uniqueNumberSet.has(num));

  console.log('Filtered Numbers:', filteredNumbers);

  const previousWindowState = [...numberWindow];
  for (let num of filteredNumbers) {
    if (numberWindow.length < MAX_WINDOW_SIZE) {
      numberWindow.push(num);
      uniqueNumberSet.add(num);
    } else {
      const oldestNumber = numberWindow.shift();
      uniqueNumberSet.delete(oldestNumber);
      numberWindow.push(num);
      uniqueNumberSet.add(num);
    }
  }

  const average = calculateAverage(numberWindow);
  console.log('Current Window:', numberWindow);
  console.log('Average:', average);

  const responseTime = Date.now() - startTime;
  if (responseTime > 500) {
    return res.status(500).json({ error: 'Request timeout' });
  }

  res.json({
    previousWindowState,
    currentWindowState: numberWindow,
    numbers: filteredNumbers,
    average
  });
});

const fetchNumbersFromApi = async (numberid) => {
  try {
    const response = await axios.get(`${NUMBERS_API_ENDPOINT}/${numberid}`, {
      headers: {
        'Authorization': `${authToken.token_type} ${authToken.access_token}`
      },
      timeout: 500
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      console.error('Error response from API:', {
        status: error.response.status,
        data: error.response.data
      });
    } else if (error.request) {
      console.error('No response received from API:', error.request);
    } else {
      console.error('Error setting up API request:', error.message);
    }
    return null;
  }
};

const calculateAverage = (numbers) => {
  if (numbers.length === 0) return 0;
  const sum = numbers.reduce((acc, num) => acc + num, 0);
  return sum / numbers.length;
};

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});