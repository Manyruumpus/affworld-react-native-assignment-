# My Tasks - React Native Assignment

-   **Author:** [Your Name]

## 📝 App Description

"My Tasks" is a simple and clean mobile application built with React Native and Expo. It allows users to manage their daily tasks by adding, completing, and deleting them. The app also features local notifications to remind users of their tasks and persists the task list even when the app is closed.

## ✨ Core Features

-   **Add Tasks:** A simple text input and button to add new tasks.
-   **View Tasks:** A scrollable list displays all current tasks.
-   **Complete Tasks:** Tap on a task to toggle its completion status, which is visually indicated with a strikethrough.
-   **Delete Tasks:** An intuitive trash icon to remove tasks from the list.
-   **Task Reminders:** A local notification is automatically scheduled 10 seconds after a task is created.
-   **Data Persistence:** Tasks are saved to the device's local storage (`AsyncStorage`) and are reloaded when the app restarts.
-   **Notification Cancellation:** When a task is marked as complete, its scheduled notification is automatically cancelled.

## 🛠️ Setup and Running the Application

Follow these instructions to run the application on your own device using Expo Go.

### Prerequisites

-   [Node.js](https://nodejs.org/) (LTS version recommended)
-   [Git](https://git-scm.com/)
-   Expo Go app installed on your iOS or Android device.

### Installation & Launch

1.  **Clone the Repository**
    ```bash
    git clone [URL_OF_YOUR_GITHUB_REPO]
    cd MyTasksApp
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```
    or if you use yarn:
    ```bash
    yarn install
    ```

3.  **Run the Application**
    ```bash
    npx expo start
    ```

4.  **Open in Expo Go**
    - A QR code will appear in your terminal.
    - Open the Expo Go app on your phone.
    - Scan the QR code using your phone's camera (on iOS) or the scanner within the Expo Go app (on Android). The app will then build and launch on your device.

## 🤔 Challenges and Design Choices

-   **State Management:** I chose to use React's built-in `useState` and `useEffect` hooks for state management. This approach is lightweight and sufficient for an application of this scale, avoiding the need for more complex libraries like Redux or MobX.

-   **Data Persistence:** To ensure tasks are not lost when the app closes, I implemented `AsyncStorage`. A `useEffect` hook monitors the `tasks` state array. Whenever this array changes (a task is added, toggled, or deleted), the entire array is serialized to a JSON string and saved. Another `useEffect` hook runs once on app launch to load the saved tasks from storage.

-   **Notifications:** Integrating `expo-notifications` was straightforward. A key challenge was implementing the bonus feature of cancelling a notification. I solved this by storing the `notificationId` (returned when scheduling a notification) within the task object itself. When a task is toggled to complete or deleted, this ID is used to call `cancelScheduledNotificationAsync`, preventing unwanted reminders. This makes the user experience much cleaner.

-   **Component Structure:** For simplicity and to keep the submission focused, I contained all the logic within a single `App.js` file. In a larger application, I would have broken down the UI into smaller, reusable components like `TaskItem.js`, `TaskInput.js`, and `TaskList.js` to improve maintainability and separation of concerns.