// --- Copy and paste this code into your "Format Final Response" node in n8n ---

// Get data from both inputs
const aiResponse = items[0].json;
const sessionData = items[1].json;

// Handle initial error cases
if (aiResponse.error || sessionData.error) {
  const errorDetails = aiResponse.error ? aiResponse : sessionData;
  return [{
    json: {
      error: true,
      message: errorDetails.message || errorDetails.error || 'An error occurred in a previous step.',
      sessionId: sessionData.sessionId || null,
      callbackUrl: sessionData.callbackUrl || null
    }
  }];
}

const itineraryFromAI = aiResponse.itinerary;

if (!itineraryFromAI || !itineraryFromAI.destination || !Array.isArray(itineraryFromAI.days)) {
  return [{
    json: {
      error: true,
      message: 'Invalid itinerary structure from AI. Missing destination or days array.',
      sessionId: sessionData.sessionId,
      callbackUrl: sessionData.callbackUrl
    }
  }];
}

// --- Helper Functions ---
function generateUniqueId() {
  return 'trip-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
}

function formatDate(dateString) {
  if (!dateString) return new Date().toISOString().split('T')[0];
  const date = new Date(dateString);
  const options = { year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC' };
  return date.toLocaleDateString('en-US', options);
}

// A generic function to create a standardized activity object
function createActivity(item, defaultType) {
    const name = item.name || "Unnamed Activity";
    const description = item.description || "No description provided.";
    const lowerName = name.toLowerCase();
    
    let type = defaultType;
    let icon = defaultType;

    if (defaultType === 'activity') {
        if (lowerName.includes('museum') || lowerName.includes('temple') || lowerName.includes('historical')) { type = 'attraction'; icon = 'landmark'; }
        else if (lowerName.includes('spa') || lowerName.includes('massage')) { type = 'wellness'; icon = 'spa'; }
        else if (lowerName.includes('shop') || lowerName.includes('market')) { type = 'shopping'; icon = 'shopping'; }
        else if (lowerName.includes('check-in') || lowerName.includes('check-out') || lowerName.includes('airport') || lowerName.includes('ferry')) { type = 'transport'; icon = 'transport'; }
    } else if (defaultType === 'food') {
        icon = 'food';
    } else if (defaultType === 'nightlife') {
        icon = 'nightlife';
    }

    return {
        time: item.time || "Time TBD",
        name: name,
        description: description,
        type: type,
        icon: icon,
        location: item.location || "Location TBD",
        cost: item.cost ?? "Varies",
        transport: item.transport || "Not specified",
        notes: item.notes || ""
    };
}


// --- Main Processing Logic ---

const formattedDays = itineraryFromAI.days.map(day => {
  const allItemsForDay = [];

  // Consolidate all items from various arrays into one
  if (Array.isArray(day.activities)) {
    day.activities.forEach(act => allItemsForDay.push(createActivity(act, 'activity')));
  }
  if (Array.isArray(day.meals)) {
    day.meals.forEach(meal => allItemsForDay.push(createActivity(meal, 'food')));
  }
  if (Array.isArray(day.nightlife)) {
    day.nightlife.forEach(item => allItemsForDay.push(createActivity(item, 'nightlife')));
  }
  
  // Sort all items chronologically by time
  allItemsForDay.sort((a, b) => (a.time || "99:99").localeCompare(b.time || "99:99"));

  // Intelligently categorize items into the breakdown structure
  const breakfast = allItemsForDay.find(a => a.type === 'food' && (a.name.toLowerCase().includes('breakfast') || parseInt((a.time || "08:00").split(':')[0]) < 10));
  const lunch = allItemsForDay.find(a => a.type === 'food' && (a.name.toLowerCase().includes('lunch') || (parseInt((a.time || "13:00").split(':')[0]) >= 12 && parseInt((a.time || "13:00").split(':')[0]) < 15)));
  const dinner = allItemsForDay.find(a => a.type === 'food' && (a.name.toLowerCase().includes('dinner') || parseInt((a.time || "19:00").split(':')[0]) >= 18));
  
  const morningActivities = allItemsForDay.filter(a => a.type !== 'food' && (!breakfast || a.time !== breakfast.time) && parseInt((a.time || "09:00").split(':')[0]) < 12);
  const afternoonActivities = allItemsForDay.filter(a => a.type !== 'food' && (!lunch || a.time !== lunch.time) && parseInt((a.time || "14:00").split(':')[0]) >= 12 && parseInt((a.time || "14:00").split(':')[0]) < 18);
  const nightlifeActivities = allItemsForDay.filter(a => a.type !== 'food' && (!dinner || a.time !== dinner.time) && parseInt((a.time || "21:00").split(':')[0]) >= 18);


  const breakdown = {
      breakfast: breakfast || null,
      lunch: lunch || null,
      dinner: dinner || null,
      morningActivities: morningActivities,
      afternoonActivities: afternoonActivities,
      nightlifeActivities: nightlifeActivities
  };

  return {
    day: day.day,
    date: formatDate(day.date),
    activities: allItemsForDay, // A complete flat list for backward compatibility or debugging
    breakdown: breakdown // The new, consistent, and correctly structured breakdown
  };
});

const finalItinerary = {
  id: generateUniqueId(),
  destination: itineraryFromAI.destination,
  startDate: new Date(itineraryFromAI.fromDate).toISOString(),
  endDate: new Date(itineraryFromAI.toDate).toISOString(),
  days: formattedDays,
  accommodation: itineraryFromAI.accommodation,
  costBreakdown: itineraryFromAI.costBreakdown
};


// Final return object for the webhook
return [{
  json: {
    itinerary: finalItinerary,
    callbackUrl: sessionData.callbackUrl,
    sessionId: sessionData.sessionId
  }
}];
