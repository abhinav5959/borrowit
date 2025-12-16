# BorrowIt - Community Borrowing Platform

**BorrowIt** is a React-based web application designed to help students and community members borrow and lend items within their campus. It fosters a sharing economy, reduces waste, and builds community connections.

## 🚀 Key Features

### 1. **Authentication & User Profiles**
-   **Sign Up / Login**: Secure authentication using Firebase Auth (Email/Password & Google Sign-In).
-   **Campus Association**: Users join a specific "Campus" during sign-up to ensure they only interact with relevant local requests.
-   **Profile Customization**: Users can upload a profile picture which is stored in Firebase Storage and displayed across the app.

### 2. **Request System**
-   **Post Requests**: Users can easily post items they need help with (e.g., "iPhone Charger", "Textbook").
-   **Categorization**: Requests are categorized (Academic, Tech, Household, Transport, Other).
-   **Real-time Feed**: The home feed updates instantly when new requests are posted.

### 3. **Real-time Chat**
-   **Instant Messaging**: When a user accepts to help with a request, a private chat channel is opened between the Requester and the Helper.
-   **Seamless UI**: A floating chat window allows users to coordinate details without leaving the page.
-   **Secure**: Messages are stored in Firestore and only accessible to the involved parties.

### 4. **Notifications System**
-   **In-App Alerts**: Users receive a Toast popup instantly when a neighbor posts a new request.
-   **Browser Notifications**: Uses the native Browser Notification API to alert users even when the tab is in the background (requires permission).
-   **Campus-Filtered**: You only get notified about requests in *your* campus.

## 🛠️ Technology Stack

-   **Frontend**: React (TypeScript), Vite
-   **Styling**: Plain CSS (Modern variables & layout), Framer Motion (Animations), Lucide React (Icons)
-   **Backend (Serverless)**: Firebase
    -   **Authentication**: User management
    -   **Firestore**: NoSQL database for requests, users, and chat messages
    -   **Storage**: Image hosting for profile pictures

## 📦 Setup & Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/abhinav5959/BorrowIt.git
    cd BorrowIt
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Environment Setup**
    Create a `.env` file in the root directory and add your Firebase configuration:
    ```env
    VITE_FIREBASE_API_KEY=your_api_key
    VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
    VITE_FIREBASE_PROJECT_ID=your_project_id
    VITE_FIREBASE_STORAGE_BUCKET=your_storage_bucket
    VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
    VITE_FIREBASE_APP_ID=your_app_id
    ```

4.  **Run Locally**
    ```bash
    npm run dev
    ```

## 🌐 Deployment (Vercel)

To deploy this project:
1.  Import the repository into Vercel.
2.  Add the **Environment Variables** from your `.env` file in the Vercel dashboard.
3.  Deploy!
