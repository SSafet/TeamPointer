# Team Pointer

![Team Pointer Screenshot](placeholder.png)

Real-time, customizable agile estimation for remote and co-located teams. Team Pointer is a simple yet powerful planning poker application designed to make sprint planning sessions interactive, efficient, and fun.

## Overview

Team Pointer is a web-based tool that facilitates agile estimation and planning. It allows teams to collaboratively estimate the effort required for development tasks using a customizable deck of voting cards. The application is built with a focus on real-time interaction and ease of use, ensuring that both local and remote teams can participate seamlessly.

The moderator creates a session, adds stories, and controls the voting rounds. Participants join the session, cast their votes, and discuss the results, which are stored for historical reference.

## ✨ Key Features

-   **Real-time Sessions**: Synchronized experience for all participants using Socket.IO.
-   **Customizable Voting Decks**: Define your own voting scale—use Fibonacci, T-shirt sizes, or any custom values. The app even remembers your last-used deck.
-   **Moderator Controls**: Full control over the session, including adding/deleting stories, selecting a story for voting, and revealing or resetting votes.
-   **Persistent Results**: The app remembers the outcome of every vote, making it easy to review past estimates.
-   **Individual Vote History**: See exactly how each participant voted on a completed story.
-   **Automatic Moderator Transfer**: If the current moderator disconnects, ownership is automatically transferred to the next active participant.
-   **Resilient Participant Handling**: If a participant disconnects after voting, their vote remains part of the result.
-   **Modern UI**: A clean, responsive, and intuitive interface built with React and Tailwind CSS.

## 💻 Technology Stack

-   **Frontend**: React, Tailwind CSS
-   **Backend**: Node.js, Express
-   **Real-time Communication**: Socket.IO

## 🚀 Getting Started

Follow these instructions to set up and run Team Pointer on your local machine.

### Prerequisites

You must have [Node.js](https://nodejs.org/) (which includes npm) installed on your computer.

### Installation & Setup

1.  **Clone the repository (or download the files):**
    ```bash
    git clone <your-repository-url>
    cd team-pointer
    ```
    If you don't have the project in a git repository, simply make sure `server.js`, `index.html`, and `package.json` are in the same directory.

2.  **Install dependencies:**
    Open a terminal in the project directory and run:
    ```bash
    npm install
    ```

3.  **Start the server:**
    To run the application, execute the following command:
    ```bash
    npm start
    ```
    You should see a confirmation in your terminal: `Team Pointer server running on http://localhost:3000`.

## 📖 How to Use

1.  **Access the Application**:
    Open your web browser and navigate to `http://localhost:3000`.

2.  **Enter Your Name**:
    Before creating or joining a session, enter your name at the top of the screen. This name will be used to identify you in the session.

3.  **Create a Session**:
    -   Optionally, customize the **voting deck** with a comma-separated list of values.
    -   Click the **Create Session** button.

4.  **Join a Session**:
    -   Enter the **Session ID** provided by the moderator.
    -   Click the **Join Session** button.

5.  **Invite Your Team**:
    -   Share the **Session ID** with your team members.
    -   For team members on the same local network, you can share a link using your local IP address (e.g., `http://192.168.1.10:3000`).

6.  **Start Planning**:
    -   **Moderator**: Add stories to the backlog, select a story to vote on, and use the "Reveal Votes" and "New Round" buttons to control the flow.
    -   **Participants**: Select a card from the bottom bar to cast your vote.

## 📄 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details. 