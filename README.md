# Charcutime

A simple web app to track the drying progress of your homemade charcuterie. Monitor weight loss over time, set target goals, and visualize everything on an interactive chart.

<img width="2247" height="1440" alt="screenshot" src="https://github.com/user-attachments/assets/1bf4d811-9a8a-43bd-b6f6-711656b0ed92" />

## Features

- **Track multiple items** - Monitor several charcuterie pieces at once (saucisson, coppa, bresaola...)
- **Weight loss chart** - Visualize drying progress over time with Chart.js
- **Target & projections** - Set a target weight loss percentage and get an estimated completion date based on linear regression
- **Local storage** - All data is stored in your browser, no server needed
- **Import / Export** - Back up and restore your data as JSON
- **Responsive** - Works on desktop and mobile

## Usage

Open `index.html` in a browser or visit the [live version](https://aeddi.github.io/charcutime).

1. Click **+ Add** to create a new item with its name, initial weight, start date, and target loss %
2. Click an item in the sidebar to expand it and add weight measurements over time
3. The chart updates automatically with your data and projected completion date
