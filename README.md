# 🍎 Diet Management App

A modern, full-stack diet tracking application that helps users monitor their daily nutrition intake and achieve their health goals. Built with React and Node.js, featuring an intuitive interface and powerful tracking capabilities.

## ✨ Features

### 📊 **Nutrition Tracking**

- **Daily Nutrition Summary** - Track calories, protein, carbs, and fat intake
- **Real-time Updates** - Nutrition data updates automatically as you add meals
- **Progress Visualization** - Clear display of your daily nutritional progress

### 🍽️ **Meal Management**

- **4 Meal Categories** - Breakfast 🌅, Lunch ☀️, Dinner 🌙, and Snacks 🍎
- **Add Food Items** - Easy food entry with portion control
- **Create Custom Foods** - Add new food items to your personal database
- **Meal History** - View and manage all food items for each meal

### 📱 **Smart Food Entry**

- **Barcode Scanner** - Scan product barcodes for instant food recognition
- **Search & Add** - Quick food search and addition functionality
- **Custom Portions** - Flexible portion size management

### 📅 **Date Navigation**

- **Calendar Integration** - Navigate between different dates
- **Historical Data** - View past meal logs and nutrition data
- **Date-specific Tracking** - All data organized by date

### 🎨 **Modern UI/UX**

- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Gradient Interface** - Beautiful gradient backgrounds and modern styling
- **Intuitive Navigation** - Easy-to-use interface with clear visual feedback

## 🛠️ Technologies Used

### Frontend

- **React 19** - Modern React with hooks and functional components
- **Vite** - Fast build tool and development server
- **Tailwind CSS** - Utility-first CSS framework for styling
- **Lucide React** - Beautiful icon library
- **@zxing/browser** - Barcode scanning functionality
- **date-fns** - Date manipulation and formatting
- **Class Variance Authority** - Component variant management

### Backend

- **Node.js** - JavaScript runtime environment
- **Express.js** - Web application framework
- **LowDB** - Lightweight JSON database
- **CORS** - Cross-origin resource sharing middleware
- **UUID** - Unique identifier generation
- **Nodemon** - Development auto-restart utility

## 📋 Prerequisites

Before running this application, make sure you have the following installed:

- **Node.js** (version 16 or higher)
- **npm** (comes with Node.js)
- **Git** (for cloning the repository)

## 🚀 Installation & Setup

### 1. Clone the Repository

```bash
git clone https://github.com/vivamau/diet-tracker.git
cd diet-tracker
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

## 🏃‍♂️ Running the Application

### Development Mode (Recommended)

You'll need to run both the backend and frontend servers simultaneously.

#### Terminal 1 - Start Backend Server

```bash
cd backend
npm run dev
```

The backend server will start on `http://localhost:3001`

#### Terminal 2 - Start Frontend Development Server

```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:5173`

### Production Mode

#### Build Frontend

```bash
cd frontend
npm run build
```

#### Start Backend (Production)

```bash
cd backend
npm start
```

## 📁 Project Structure

```
diet-tracker/
├── frontend/                 # React frontend application
│   ├── src/
│   │   ├── components/       # React components
│   │   │   ├── ui/          # Reusable UI components
│   │   │   ├── AddFoodModal.jsx
│   │   │   ├── AddNewFoodModal.jsx
│   │   │   ├── BarcodeScanner.jsx
│   │   │   ├── DateNavigation.jsx
│   │   │   ├── MealCard.jsx
│   │   │   └── NutritionSummary.jsx
│   │   ├── lib/             # Utility functions
│   │   ├── assets/          # Static assets
│   │   ├── App.jsx          # Main application component
│   │   ├── main.jsx         # Application entry point
│   │   └── index.css        # Global styles
│   ├── public/              # Public assets
│   ├── package.json         # Frontend dependencies
│   ├── vite.config.js       # Vite configuration
│   ├── tailwind.config.js   # Tailwind CSS configuration
│   └── postcss.config.js    # PostCSS configuration
├── backend/                  # Node.js backend server
│   ├── server.js            # Express server and API routes
│   ├── db.json              # LowDB database file
│   └── package.json         # Backend dependencies
├── .gitignore               # Git ignore rules
└── README.md               # Project documentation
```

## 🖥️ Usage

### Adding Food to Meals

1. **Select a Date** - Use the date navigation to choose your tracking date
2. **Choose a Meal** - Click on any meal card (Breakfast, Lunch, Dinner, or Snacks)
3. **Add Food** - Click the "Add Food" button in the meal card
4. **Search or Scan** - Either search for existing foods or use the barcode scanner
5. **Set Portion** - Adjust the portion size as needed
6. **Save** - Confirm to add the food to your meal

### Creating Custom Foods

1. **Click "Add New Food"** - Found in the Add Food modal
2. **Fill Details** - Enter food name and nutritional information per 100g
3. **Save** - Add the new food to your personal database

### Viewing Nutrition Summary

- **Daily Overview** - The top nutrition summary shows your total daily intake
- **Progress Tracking** - Monitor calories, protein, carbohydrates, and fat
- **Real-time Updates** - Data updates automatically as you modify meals

### Barcode Scanning

1. **Click Barcode Scanner** - In the Add Food modal
2. **Allow Camera Access** - Grant permission when prompted
3. **Scan Product** - Point camera at product barcode
4. **Automatic Detection** - Food will be automatically detected and added

## 🗄️ Database

The application uses **LowDB** as a lightweight JSON database stored in [`backend/db.json`](backend/db.json). The database contains:

- **foods** - Collection of food items with nutritional information
- **meals** - Daily meal entries organized by date and meal type

## 🔧 Development

### Frontend Development

- **Hot Reload** - Vite provides instant hot reload during development
- **ESLint** - Code linting for consistent code quality
- **Responsive Design** - Mobile-first approach with Tailwind CSS

### Backend Development

- **Nodemon** - Auto-restart server on code changes
- **CORS Enabled** - Cross-origin requests allowed for frontend
- **RESTful API** - Clean API endpoints for data management

## 🌐 API Endpoints

| Method | Endpoint           | Description                 |
| ------ | ------------------ | --------------------------- |
| GET    | `/api/foods`       | Get all food items          |
| POST   | `/api/foods`       | Create new food item        |
| GET    | `/api/meals/:date` | Get meals for specific date |
| POST   | `/api/meals`       | Add food to meal            |
| DELETE | `/api/meals/:id`   | Remove food from meal       |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the ISC License.

## 👨‍💻 Author

**Maurizio Blasilli** - [@vivamau](https://github.com/vivamau)

---

**Happy Tracking! 🎯** Start your journey to better nutrition today with the Diet Management App.
