# HakTrak Security Dashboard

This is a modern security dashboard application built with Next.js and ApexCharts, featuring a sleek dark theme design.

## Features

- **Security Score Gauge**: A radial gauge showing the organization's security posture
- **Metrics Cards**: Cards displaying key metrics with trend indicators
- **Mentions Overview**: Semi-circular gauge showing the sentiment breakdown of mentions
- **Employees Donut Chart**: Visualization of employee categories
- **Compromised Employees Table**: List of employees with security incidents
- **Sources Bar Chart**: Horizontal bar chart showing top sources of security events
- **Status Donut Charts**: Visualizations for logs and findings
- **Top Malware Chart**: Line chart showing malware trends over time

## Technologies Used

- **Next.js**: For the application framework
- **TypeScript**: For type safety
- **Tailwind CSS**: For styling
- **ApexCharts**: For data visualizations
- **Shadcn UI**: For UI components

## Implementation Details

### Charts and Visualizations

All charts are implemented using ApexCharts, which provides a rich set of interactive charts:

- **Radial/Gauge Charts**: Used for security score and mentions overview
- **Donut Charts**: Used for employee breakdowns and status visualizations
- **Bar Charts**: Used for displaying top sources
- **Line Charts**: Used for showing trends over time

### Custom Styling

The dashboard uses a dark theme with:

- Background color: `#0F0F1B`
- Card background: `#171727`
- Primary accent: Purple (`#8A2CE2`)
- Text: White and varying shades of gray for hierarchy

### Responsive Design

The dashboard is fully responsive, adapting to different screen sizes with appropriate grid layouts:

- Desktop: Multi-column layout with 6-column grid
- Tablet: Simplified layout with fewer columns
- Mobile: Single column stacked layout

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```
   npm install
   ```
3. Run the development server:
   ```
   npm run dev
   ```
4. Open [http://localhost:3000/dashboard](http://localhost:3000/dashboard) to view the dashboard

## File Structure

- `app/dashboard/page.tsx`: Main dashboard page layout
- `components/dashboard/`: Chart and widget components
  - `security-gauge.tsx`: Security score gauge component
  - `metrics-card.tsx`: Individual metric card component
  - `mentions-overview.tsx`: Mentions sentiment gauge
  - `employees-donut-chart.tsx`: Employee distribution chart
  - `compromised-employees.tsx`: Table of compromised employees
  - `sources-bar-chart.tsx`: Bar chart for top sources
  - `status-donut.tsx`: Reusable donut chart for status visualizations
  - `top-malware.tsx`: Line chart for malware trends

# Firebase Storage Setup for File Uploads

This README provides instructions for setting up Firebase Storage to handle file uploads in the application.

## Option 1: Using Firebase Storage Emulator (Recommended for Development)

The Firebase Storage Emulator provides a local development environment that avoids CORS issues.

### Steps to set up:

1. **Install the Firebase CLI** (if not already installed)

   ```bash
   npm install -g firebase-tools
   ```

2. **Login to Firebase** (only needed once)

   ```bash
   firebase login
   ```

3. **Start the Firebase Storage Emulator**

   For Windows:
   ```
   start-emulator.bat
   ```

   For Mac/Linux:
   ```bash
   npm run start-emulator
   # or
   npx firebase emulators:start --only storage
   ```

4. **Keep the emulator running** in a separate terminal window while developing.

5. **Refresh your application** - it should now use the local emulator for file uploads.

## Option 2: Configure CORS for Production Firebase Storage

If you need to use the production Firebase Storage (not the emulator):

1. **Update `cors.json`** with your production domain.

2. **Upload CORS configuration**:

   ```bash
   gsutil cors set cors.json gs://haktrak-156bd.appspot.com
   ```
   (Replace with your actual storage bucket name)

3. **Verify CORS configuration**:

   ```bash
   gsutil cors get gs://haktrak-156bd.appspot.com
   ```

## Troubleshooting

### CORS Errors:
- Ensure your storage bucket name in `.env` doesn't have trailing commas or extra spaces
- Make sure the CORS configuration includes your domain
- Check browser console for detailed error messages

### Connection Errors:
- Verify the emulator is running on the configured port
- Check if the emulator port in firebase.json matches the port in firebase-config.ts
- Make sure your firewall isn't blocking the connection

### File Upload Failures:
- Check Firebase Storage rules to ensure write permissions
- Verify your Firebase project is properly configured
- Look for detailed error messages in the developer console 