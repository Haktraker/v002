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