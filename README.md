# Minesweeper Project

## Introduction

This repository contains the Minesweeper game developed using three different frontend frameworks (Next.js, Svelte, and Vue.js) and a backend powered by Express.js. This project is part of the ITU (User Interface Programming) course for the 2024/2025 academic year.

## Repository Structure
    .
    ├── shared      - Contains shared TypeScript types.
    ├── backend     - Backend implemented in Express.js.
    └── frontend    - Contains directories for each frontend framework.
        ├── nextjs  - Next.js implementation of the Minesweeper game.
        ├── svelte  - Svelte implementation of the Minesweeper game.
        └── vue     - Vue.js implementation of the Minesweeper game.

## Build Instructions

To build the Minesweeper project, follow these steps:

1. **Clone the Repository**:
    ```bash
    git clone https://github.com/yourusername/minesweeper-project.git
    cd minesweeper-project
    ```

2. **Install Dependencies**:
   - For the backend:
    ```bash
    cd backend
    npm install
    ```

   - For each frontend framework (replace `{framework-directory}` with the appropriate directory name):
    ```bash
    cd frontend/{framework-directory}
    npm install
    ```

3. **Build the Frontend** (if applicable):
   - Depending on the framework, you may need to build the frontend:
    ```bash
    cd frontend/{framework-directory}
    npm run build
    ```

4. **Run the Application**:
   - Start the backend server:
    ```bash
    cd backend
    npm start
    ```

   - Start the frontend for the desired framework : 
    ```bash
    cd frontend/{framework-directory}
    npm run dev
    ```
   - For vue application start frontend client as:
    ```bash
    cd frontend/vue
    npm run serve
    ```

5. **Access the Application**:
   - Open your browser and navigate to `http://localhost:3000`.  (For Next.js)
   - Open your browser and navigate to `http://localhost:8080`.  (For Vue.js and also for Svelte, so dont start them both in the same moment)       

## Authors

* **Name**: Marek Čupr (xcuprm01)
* **Name**: Jindřich Halva (xhalva05)
* **Name**: Dominik Šmíd (xsmiddo00)
