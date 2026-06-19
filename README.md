# Community Water Management Project

This is a comprehensive management and audit platform for rural or local community water distribution networks. It coordinates community census data, logs water infrastructure assets, manages executive committee terms, processes household subscription billing and collections, tracks operational maintenance logs, and builds structured financial reports.

---

## System Architecture

The application is structured as a multi-service platform:

*   **`water_management_frontend`**: A React single-page application built on Vite and Tailwind CSS. It provides interactive administration dashboards, financial ledger screens, household/member directories, and a interface for generating audits.
*   **`Water_Project_Backend`**: A Node.js Express API that serves as the transactional backend. It handles security controls, user authentication, data validations, audit logs, session management, and CRUD operations for all entities.
*   **`community_Water_Project`**: A Spring Boot Java microservice focused on analytical document compilation. It uses JasperReports, OpenPDF, and Apache POI to query the database and render PDF and Excel files on demand.

```
                               ┌─────────────────────────────┐
                               │     React SPA Frontend      │
                               │  water_management_frontend  │
                               └──────────────┬──────────────┘
                                              │
                      ┌───────────────────────┴───────────────────────┐
                      ▼                                               ▼
       ┌───────────────────────────────┐               ┌───────────────────────────────┐
       │      Node.js Express API      │               │  Spring Boot Report Service   │
       │     Water_Project_Backend     │               │    community_Water_Project    │
       └──────────────┬────────────────┘               └──────────────┬────────────────└
                      │                                               │
                      └───────────────────────┬───────────────────────┘
                                              ▼
                               ┌───────────────────────────────┐
                               │       MySQL Database          │
                               │      water_project_db         │
                               └───────────────────────────────┘
```

---

## Local Setup and Installation

### Prerequisites
Make sure the following runtimes are installed on your machine:
*   [Node.js](https://nodejs.org/) (v18 or higher)
*   [Java JDK 17](https://adoptium.net/)
*   [Apache Maven](https://maven.apache.org/) (v3.8 or higher)
*   [MySQL Server](https://dev.mysql.com/downloads/mysql/) (v8.0 or higher)

---

### Step 1: Database Setup
1. Open your MySQL client and create a new database:
   ```sql
   CREATE DATABASE water_project_db;
   ```
2. Note your database username and password. The Spring Boot microservice is preconfigured with the following credentials (which can be edited or overridden):
   *   **URL**: `jdbc:mysql://localhost:3306/water_project_db`
   *   **Username**: `root`
   *   **Password**: `root`

---

### Step 2: Configure and Start the Transactional Backend (`Water_Project_Backend`)
The transactional server handles user login, audit logs, and CRUD endpoints on port `5000`.

1. Navigate to the backend directory:
   ```bash
   cd Water_Project_Backend
   ```
2. Install the Node.js packages:
   ```bash
   npm install
   ```
3. Create a `.env` file in the root of the `Water_Project_Backend` directory:
   ```env
   PORT=5000
   DB_HOST=localhost
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=root
   DB_NAME=water_project_db
   JWT_SECRET=your_jwt_signing_secret_key_here
   JWT_EXPIRES_IN=7d
   ```
4. Start the Express development server:
   ```bash
   npm run dev
   ```
   *The server will start at `http://localhost:5000`.*

---

### Step 3: Configure and Start the Reporting Service (`community_Water_Project`)
The reporting service manages the compiling and serving of JasperReports on port `8080`.

1. Navigate to the Spring Boot directory:
   ```bash
   cd community_Water_Project
   ```
2. (Optional) Review or edit the database connections in the resources file:
   `src/main/resources/application.properties`
3. Launch the Spring Boot application using Maven:
   ```bash
   mvn spring-boot:run
   ```
   *The service will start at `http://localhost:8080`.*

---

### Step 4: Configure and Start the Frontend (`water_management_frontend`)
The React SPA handles the UI interfaces and charts.

1. Navigate to the frontend directory:
   ```bash
   cd water_management_frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. (Optional) Review the API integrations in:
   `src/.env`
   ```env
   VITE_API_URL=http://localhost:5000/api
   VITE_REPORT_URL=http://localhost:8080/reports
   ```
4. Start the Vite dev server:
   ```bash
   npm run dev
   ```
   *Open the URL shown in your terminal (usually `http://localhost:5173`) in your browser.*

---

## User Roles & Permissions

Upon logging in, the system enforces access control limits based on three roles:
1.  **System Admin (`system_admin`)**: Unrestricted access. Configures annual subscription rates, registers/manages user accounts, creates geographic water zones, and views consolidated audit logs.
2.  **Zonal Admin (`zonal_admin`)**: Administrative rights restricted to their designated water zone. Registers households and residents, logs asset maintenance, records expenditures, and inputs collections.
3.  **Representative (`representative`)**: Access for household heads to review their billing ledger, outstanding subscriptions, and payment history. Access to other administrative records is blocked.
