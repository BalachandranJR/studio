// --- Start of Corrected Code for the "Process Input Data" Node ---

const payload = items[0].json;

// Determine the actual data location
let actualData = payload.body || payload.query || payload.params || payload;

// --- Helper Functions ---
// A robust function to parse a date and ignore time/timezone.
function parseDateAsUTC(dateString) {
  if (!dateString) return null;
  const date = new Date(dateString);
  // Create a new date using only the year, month, and day from the original date in UTC.
  // This effectively strips the time and timezone information.
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function objectToArray(obj) {
  if (!obj || typeof obj !== 'object') return [];
  return Object.values(obj).filter(Boolean);
}

// --- Validation and Processing ---

// **MODIFICATION**: Removed the check for `callbackUrl` as it's no longer needed in a direct-fetch model.
if (!actualData.destination || !actualData.dates || !actualData.dates.from || !actualData.dates.to) {
  return [{ json: { error: 'Missing required fields (destination or dates)' } }];
}

// Parse dates correctly, treating them as calendar dates without timezones.
const fromDate = parseDateAsUTC(actualData.dates.from);
const toDate = parseDateAsUTC(actualData.dates.to);

if (!fromDate || !toDate || isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
    return [{ json: { error: 'Invalid date format provided' } }];
}

// Calculate the duration correctly (difference in days). Add 1 to be inclusive.
const duration = Math.round((toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

if (duration <= 0) {
  return [{ json: { error: 'Invalid date range provided. "To" date must be after "From" date.' } }];
}

// Format the date back to a simple YYYY-MM-DD string.
const fromDateString = fromDate.toISOString().split('T')[0];
const toDateString = toDate.toISOString().split('T')[0];


// --- Final Processed Data ---

const processedData = {
  destination: actualData.destination.trim(),
  fromDate: fromDateString,
  toDate: toDateString,
  duration,
  people: parseInt(actualData.numPeople, 10) || 1,
  ageGroups: objectToArray(actualData.ageGroups),
  interests: objectToArray(actualData.interests),
  transport: objectToArray(actualData.transport),
  foodPreferences: objectToArray(actualData.foodPreferences),
  currency: actualData.budget?.currency || 'USD',
  budgetAmount: parseFloat(actualData.budget?.amount) || 1000,
  // **REMOVED**: callbackUrl and sessionId are no longer needed
};

return [{ json: processedData }];

// --- End of Corrected Code ---
