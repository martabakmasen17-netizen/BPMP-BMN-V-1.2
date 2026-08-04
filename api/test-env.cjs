const { google } = require('googleapis');
require('dotenv').config();

async function test() {
  console.log("Checking Environment Variables...");
  console.log("GOOGLE_CLIENT_EMAIL:", process.env.GOOGLE_CLIENT_EMAIL ? "SET" : "NOT SET");
  console.log("GOOGLE_PRIVATE_KEY:", process.env.GOOGLE_PRIVATE_KEY ? "SET (length: " + process.env.GOOGLE_PRIVATE_KEY.length + ")" : "NOT SET");
  console.log("SPREADSHEET_ID:", process.env.SPREADSHEET_ID ? "SET" : "NOT SET");

  if (!process.env.GOOGLE_CLIENT_EMAIL || !process.env.GOOGLE_PRIVATE_KEY) {
    console.log("Missing credentials.");
    return;
  }

  try {
    const auth = new google.auth.GoogleAuth({
      credentials: {
        client_email: process.env.GOOGLE_CLIENT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      },
      scopes: [
        "https://www.googleapis.com/auth/spreadsheets",
        "https://www.googleapis.com/auth/drive.file"
      ],
    });
    
    console.log("Authenticating...");
    const client = await auth.getClient();
    console.log("Authentication successful!");
    
    if (process.env.SPREADSHEET_ID) {
      const sheets = google.sheets({ version: "v4", auth });
      const spreadsheet = await sheets.spreadsheets.get({
        spreadsheetId: process.env.SPREADSHEET_ID,
      });
      console.log("Spreadsheet access successful! Title:", spreadsheet.data.properties.title);
    }
  } catch (err) {
    console.error("Error during authentication/access:", err.message);
  }
}
test();
